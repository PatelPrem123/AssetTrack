import { MaintenanceRecord } from '../../models/MaintenanceRecord.js';
import { ComponentChange } from '../../models/ComponentChange.js';
import { Asset } from '../../models/Asset.js';
import { StockItem } from '../../models/StockItem.js';
import { StockMovement } from '../../models/StockMovement.js';
import { AuditLog } from '../../models/AuditLog.js';
import { ASSET_STATUSES, MAINTENANCE_STATUSES } from '../../config/constants.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

export class MaintenanceService {
  static async generateTicketNumber(organizationId) {
    const year = new Date().getFullYear();
    const count = await MaintenanceRecord.countDocuments({ organizationId });
    const seq = String(count + 1).padStart(4, '0');
    return `MNT-${year}-${seq}`;
  }

  static async createTicket(organizationId, payload, reportedByUserId, meta = {}) {
    const { assetId, maintenanceType, priority, issueDescription, technicianId, notes } = payload;

    const asset = await Asset.findOne({ _id: assetId, organizationId });
    if (!asset) throw new NotFoundError('Asset');

    const ticketNumber = await this.generateTicketNumber(organizationId);

    // 1. Create Maintenance Record
    const ticket = await MaintenanceRecord.create({
      organizationId,
      ticketNumber,
      assetId: asset._id,
      reportedBy: reportedByUserId,
      technicianId,
      maintenanceType,
      priority: priority || 'Medium',
      status: technicianId ? MAINTENANCE_STATUSES.ASSIGNED : MAINTENANCE_STATUSES.REPORTED,
      issueDescription,
      notes,
    });

    // 2. Set Asset status to Under Repair (DEC-001)
    asset.status = ASSET_STATUSES.UNDER_REPAIR;
    await asset.save();

    // 3. Audit trail
    await AuditLog.create({
      organizationId,
      action: 'MAINTENANCE_TICKET_CREATED',
      entityType: 'MaintenanceRecord',
      entityId: ticket._id,
      performedBy: reportedByUserId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: {
        ticketNumber: ticket.ticketNumber,
        assetTag: asset.assetTag,
        maintenanceType,
      },
    });

    return ticket;
  }

  static async updateTicket(organizationId, ticketId, payload, technicianUserId, meta = {}) {
    const ticket = await MaintenanceRecord.findOne({ _id: ticketId, organizationId });
    if (!ticket) throw new NotFoundError('Maintenance ticket');

    Object.assign(ticket, payload);
    await ticket.save();

    await AuditLog.create({
      organizationId,
      action: 'MAINTENANCE_TICKET_UPDATED',
      entityType: 'MaintenanceRecord',
      entityId: ticket._id,
      performedBy: technicianUserId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: { status: ticket.status, diagnosis: ticket.diagnosis },
    });

    return ticket;
  }

  /**
   * Log hardware component evolution and deduct spare parts from stock (DEC-005)
   */
  static async logComponentChange(organizationId, ticketId, payload, technicianUserId, meta = {}) {
    const { componentType, previousSpecification, newSpecification, stockItemId, quantityConsumed, updatedHardwareSpecs } = payload;

    const ticket = await MaintenanceRecord.findOne({ _id: ticketId, organizationId });
    if (!ticket) throw new NotFoundError('Maintenance ticket');

    const asset = await Asset.findOne({ _id: ticket.assetId, organizationId });
    if (!asset) throw new NotFoundError('Asset');

    // 1. If spare parts consumed, deduct from stock ledger (DEC-005, DEC-006)
    if (stockItemId) {
      const stockItem = await StockItem.findOne({ _id: stockItemId, organizationId });
      if (!stockItem) throw new NotFoundError('Stock item');

      const qty = quantityConsumed || 1;
      if (stockItem.currentQuantity < qty) {
        throw new BadRequestError(
          `Insufficient stock for '${stockItem.name}'. Available: ${stockItem.currentQuantity}, required: ${qty}`
        );
      }

      const prevQty = stockItem.currentQuantity;
      stockItem.currentQuantity -= qty;
      await stockItem.save();

      await StockMovement.create({
        organizationId,
        stockItemId: stockItem._id,
        movementType: 'OUT',
        quantity: qty,
        previousQuantity: prevQty,
        newQuantity: stockItem.currentQuantity,
        referenceType: 'Maintenance',
        referenceId: ticket._id,
        performedBy: technicianUserId,
        notes: `Component swap on ${asset.assetTag}: ${componentType} upgrade`,
      });
    }

    // 2. Create ComponentChange record
    const change = await ComponentChange.create({
      organizationId,
      assetId: asset._id,
      maintenanceRecordId: ticket._id,
      technicianId: technicianUserId,
      componentType,
      previousSpecification,
      newSpecification,
      stockItemId,
      quantityConsumed: quantityConsumed || 1,
    });

    // 3. Auto-sync parent asset specifications if provided
    if (updatedHardwareSpecs) {
      if (asset.specifications) {
        Object.assign(asset.specifications, updatedHardwareSpecs);
      } else {
        asset.specifications = updatedHardwareSpecs;
      }
      asset.markModified('specifications');
      await asset.save();
    }

    // 4. Audit Log
    await AuditLog.create({
      organizationId,
      action: 'COMPONENT_REPLACED',
      entityType: 'ComponentChange',
      entityId: change._id,
      performedBy: technicianUserId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: {
        assetTag: asset.assetTag,
        componentType,
        previousSpecification,
        newSpecification,
      },
    });

    return change;
  }

  /**
   * Complete repair and restore asset to Available status
   */
  static async completeTicket(organizationId, ticketId, payload, technicianUserId, meta = {}) {
    const { actionTaken, costMinor, assetConditionPostRepair, notes } = payload;

    const ticket = await MaintenanceRecord.findOne({ _id: ticketId, organizationId });
    if (!ticket) throw new NotFoundError('Maintenance ticket');

    ticket.status = MAINTENANCE_STATUSES.COMPLETED;
    ticket.completedAt = new Date();
    if (actionTaken) ticket.actionTaken = actionTaken;
    if (costMinor !== undefined) ticket.costMinor = costMinor;
    if (assetConditionPostRepair) ticket.assetConditionPostRepair = assetConditionPostRepair;
    if (notes) ticket.notes = notes;
    await ticket.save();

    // Restore parent asset status to Available
    const asset = await Asset.findOne({ _id: ticket.assetId, organizationId });
    if (asset) {
      asset.status = ASSET_STATUSES.AVAILABLE;
      if (assetConditionPostRepair) asset.condition = assetConditionPostRepair;
      await asset.save();
    }

    await AuditLog.create({
      organizationId,
      action: 'MAINTENANCE_TICKET_COMPLETED',
      entityType: 'MaintenanceRecord',
      entityId: ticket._id,
      performedBy: technicianUserId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: {
        ticketNumber: ticket.ticketNumber,
        assetTag: asset?.assetTag,
        condition: asset?.condition,
      },
    });

    return ticket;
  }

  static async listTickets(organizationId, filter = {}) {
    const query = { organizationId };

    if (filter.status) query.status = filter.status;
    if (filter.assetId) query.assetId = filter.assetId;
    if (filter.technicianId) query.technicianId = filter.technicianId;
    if (filter.priority) query.priority = filter.priority;

    return MaintenanceRecord.find(query)
      .populate('assetId', 'assetTag name manufacturer model serialNumber qrCodeReference status condition')
      .populate('reportedBy', 'name email role')
      .populate('technicianId', 'name email role')
      .sort({ createdAt: -1 })
      .lean();
  }

  static async getTicketById(organizationId, ticketId) {
    const ticket = await MaintenanceRecord.findOne({ _id: ticketId, organizationId })
      .populate('assetId', 'assetTag name manufacturer model serialNumber specifications status condition')
      .populate('reportedBy', 'name email')
      .populate('technicianId', 'name email')
      .lean();

    if (!ticket) throw new NotFoundError('Maintenance ticket');

    const componentChanges = await ComponentChange.find({
      organizationId,
      maintenanceRecordId: ticket._id,
    })
      .populate('technicianId', 'name email')
      .populate('stockItemId', 'name itemCode')
      .sort({ replacedAt: -1 })
      .lean();

    return {
      ...ticket,
      componentChanges,
    };
  }
}

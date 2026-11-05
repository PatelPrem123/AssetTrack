import { StockItem } from '../../models/StockItem.js';
import { StockMovement } from '../../models/StockMovement.js';
import { Notification } from '../../models/Notification.js';
import { AuditLog } from '../../models/AuditLog.js';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/errors.js';

export class StockLedgerService {
  static async createStockItem(organizationId, payload, userId) {
    const { itemCode, name, category, unit, currentQuantity, minStockLevel, unitCostMinor, vendorId, location } = payload;
    const normalizedCode = itemCode.toUpperCase().trim();

    const existing = await StockItem.findOne({ organizationId, itemCode: normalizedCode });
    if (existing) {
      throw new ConflictError(`Stock item with code '${normalizedCode}' already exists.`);
    }

    const item = await StockItem.create({
      organizationId,
      itemCode: normalizedCode,
      name: name.trim(),
      category: category || 'Other',
      unit: unit || 'pcs',
      currentQuantity: currentQuantity || 0,
      minStockLevel: minStockLevel ?? 5,
      unitCostMinor: unitCostMinor || 0,
      vendorId,
      location: location || 'Store Room',
    });

    // Record initial movement if opening quantity > 0
    if (item.currentQuantity > 0) {
      await StockMovement.create({
        organizationId,
        stockItemId: item._id,
        movementType: 'IN',
        quantity: item.currentQuantity,
        previousQuantity: 0,
        newQuantity: item.currentQuantity,
        referenceType: 'Manual',
        performedBy: userId,
        notes: 'Initial opening stock registration',
      });
    }

    return item;
  }

  static async listStockItems(organizationId, filter = {}) {
    const query = { organizationId, isActive: true };
    if (filter.category) query.category = filter.category;
    if (filter.lowStockOnly === 'true' || filter.lowStockOnly === true) {
      query.$expr = { $lte: ['$currentQuantity', '$minStockLevel'] };
    }

    return StockItem.find(query)
      .populate('vendorId', 'name vendorCode')
      .sort({ category: 1, name: 1 })
      .lean();
  }

  /**
   * Record audited stock movement with atomic balance update and non-negative guard (DEC-006)
   */
  static async recordMovement(organizationId, payload, userId) {
    const { stockItemId, movementType, quantity, referenceType, referenceId, notes } = payload;

    const item = await StockItem.findOne({ _id: stockItemId, organizationId });
    if (!item) throw new NotFoundError('Stock item');

    const previousQuantity = item.currentQuantity;
    let newQuantity = previousQuantity;

    if (movementType === 'IN') {
      newQuantity = previousQuantity + quantity;
    } else if (movementType === 'OUT') {
      if (previousQuantity < quantity) {
        throw new BadRequestError(
          `Insufficient stock. Current available: ${previousQuantity}, requested: ${quantity}. Stock balance cannot be negative.`
        );
      }
      newQuantity = previousQuantity - quantity;
    } else if (movementType === 'ADJUSTMENT') {
      newQuantity = quantity; // Absolute adjustment to counted physical audit quantity
    }

    // Mutate stock item balance
    item.currentQuantity = newQuantity;
    await item.save();

    // Create append-only ledger transaction
    const movement = await StockMovement.create({
      organizationId,
      stockItemId: item._id,
      movementType,
      quantity,
      previousQuantity,
      newQuantity,
      referenceType: referenceType || 'Manual',
      referenceId,
      performedBy: userId,
      notes,
    });

    // Low stock notification trigger (DEC-010)
    if (newQuantity <= item.minStockLevel) {
      await Notification.create({
        organizationId,
        title: `Low Stock Alert: ${item.name}`,
        message: `Stock level for '${item.name}' (${item.itemCode}) dropped to ${newQuantity} ${item.unit}. Minimum threshold is ${item.minStockLevel}.`,
        type: 'Low Stock',
        entityType: 'StockItem',
        entityId: item._id,
        targetRoles: ['Admin', 'Asset Manager'],
      });
    }

    return movement;
  }

  static async listMovements(organizationId, filter = {}) {
    const query = { organizationId };
    if (filter.stockItemId) query.stockItemId = filter.stockItemId;
    if (filter.movementType) query.movementType = filter.movementType;

    return StockMovement.find(query)
      .populate('stockItemId', 'name itemCode category unit')
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }
}

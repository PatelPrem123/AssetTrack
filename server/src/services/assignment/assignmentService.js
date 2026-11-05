import { AssetAssignment } from '../../models/AssetAssignment.js';
import { Asset } from '../../models/Asset.js';
import { User } from '../../models/User.js';
import { AuditLog } from '../../models/AuditLog.js';
import { ASSET_STATUSES } from '../../config/constants.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

export class AssignmentService {
  /**
   * Assign an available asset to a designated employee (DEC-003)
   */
  static async assignAsset(organizationId, payload, assignedByUserId, meta = {}) {
    const { assetId, employeeId, conditionAtHandover, accessories, expectedReturnDate, notes } = payload;

    // 1. Verify employee belongs to caller's organization
    const employee = await User.findOne({ _id: employeeId, organizationId });
    if (!employee || !employee.isActive) {
      throw new NotFoundError('Target employee not found or inactive');
    }

    // 2. Atomic check and lock: Asset must have status 'Available'
    const asset = await Asset.findOneAndUpdate(
      {
        _id: assetId,
        organizationId,
        status: ASSET_STATUSES.AVAILABLE,
      },
      {
        $set: {
          status: ASSET_STATUSES.ASSIGNED,
          assignedTo: employee._id,
          condition: conditionAtHandover || 'Good',
        },
      },
      { new: true }
    );

    if (!asset) {
      const currentAsset = await Asset.findOne({ _id: assetId, organizationId });
      if (!currentAsset) throw new NotFoundError('Asset');
      throw new BadRequestError(
        `Cannot assign asset ${currentAsset.assetTag}. Current status is '${currentAsset.status}'. Only 'Available' assets can be checked out.`
      );
    }

    // 3. Create immutable custody record
    const assignment = await AssetAssignment.create({
      organizationId,
      assetId: asset._id,
      employeeId: employee._id,
      assignedBy: assignedByUserId,
      conditionAtHandover: conditionAtHandover || 'Good',
      accessories: accessories || [],
      expectedReturnDate,
      notes,
      status: 'Active',
    });

    // 4. Record audit event
    await AuditLog.create({
      organizationId,
      action: 'ASSET_ASSIGNED',
      entityType: 'AssetAssignment',
      entityId: assignment._id,
      performedBy: assignedByUserId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: {
        assetTag: asset.assetTag,
        employeeName: employee.name,
        expectedReturnDate,
      },
    });

    return assignment;
  }

  /**
   * Process asset return to IT storeroom (DEC-003)
   */
  static async returnAsset(organizationId, assignmentId, payload, receivedByUserId, meta = {}) {
    const { conditionAtReturn, returnNotes } = payload;

    // 1. Find active assignment
    const assignment = await AssetAssignment.findOne({
      _id: assignmentId,
      organizationId,
      status: 'Active',
    });

    if (!assignment) {
      throw new NotFoundError('Active asset assignment not found or already returned');
    }

    // 2. Mark assignment as Returned
    assignment.status = 'Returned';
    assignment.returnedAt = new Date();
    assignment.receivedBy = receivedByUserId;
    assignment.conditionAtReturn = conditionAtReturn;
    assignment.returnNotes = returnNotes;
    await assignment.save();

    // 3. Update parent asset back to Available
    const asset = await Asset.findOneAndUpdate(
      { _id: assignment.assetId, organizationId },
      {
        $set: {
          status: ASSET_STATUSES.AVAILABLE,
          assignedTo: null,
          condition: conditionAtReturn,
        },
      },
      { new: true }
    );

    // 4. Audit trail
    await AuditLog.create({
      organizationId,
      action: 'ASSET_RETURNED',
      entityType: 'AssetAssignment',
      entityId: assignment._id,
      performedBy: receivedByUserId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: {
        assetTag: asset?.assetTag,
        conditionAtReturn,
        returnedAt: assignment.returnedAt,
      },
    });

    return {
      assignment,
      asset,
    };
  }

  /**
   * Transfer device custody directly to another employee (DEC-003)
   */
  static async transferAsset(organizationId, assignmentId, payload, transferredByUserId, meta = {}) {
    const { newEmployeeId, conditionAtHandover, expectedReturnDate, transferNotes } = payload;

    const previousAssignment = await AssetAssignment.findOne({
      _id: assignmentId,
      organizationId,
      status: 'Active',
    });

    if (!previousAssignment) {
      throw new NotFoundError('Active assignment not found');
    }

    const newEmployee = await User.findOne({ _id: newEmployeeId, organizationId });
    if (!newEmployee || !newEmployee.isActive) {
      throw new NotFoundError('Target employee not found or inactive');
    }

    // 1. Close previous assignment
    previousAssignment.status = 'Transferred';
    previousAssignment.returnedAt = new Date();
    previousAssignment.receivedBy = transferredByUserId;
    previousAssignment.returnNotes = `Transferred directly to ${newEmployee.name}: ${transferNotes || ''}`;
    await previousAssignment.save();

    // 2. Create new assignment document
    const newAssignment = await AssetAssignment.create({
      organizationId,
      assetId: previousAssignment.assetId,
      employeeId: newEmployee._id,
      assignedBy: transferredByUserId,
      conditionAtHandover: conditionAtHandover || previousAssignment.conditionAtHandover,
      accessories: previousAssignment.accessories,
      expectedReturnDate,
      notes: `Transferred from previous custodian. ${transferNotes || ''}`,
      status: 'Active',
    });

    // 3. Mutate asset assignedTo
    const asset = await Asset.findOneAndUpdate(
      { _id: previousAssignment.assetId, organizationId },
      {
        $set: {
          assignedTo: newEmployee._id,
          condition: conditionAtHandover || previousAssignment.conditionAtHandover,
        },
      },
      { new: true }
    );

    // 4. Audit log
    await AuditLog.create({
      organizationId,
      action: 'ASSET_TRANSFERRED',
      entityType: 'AssetAssignment',
      entityId: newAssignment._id,
      performedBy: transferredByUserId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      details: {
        assetTag: asset?.assetTag,
        transferredTo: newEmployee.name,
      },
    });

    return newAssignment;
  }

  /**
   * List assignment history (scoped by organization, and user role)
   */
  static async listAssignments(organizationId, filter = {}, callingUser) {
    const query = { organizationId };

    // BOLA defense: regular employees can ONLY query assignments belonging to themselves
    if (callingUser && callingUser.role === 'Employee') {
      query.employeeId = callingUser._id;
    } else {
      if (filter.employeeId) query.employeeId = filter.employeeId;
    }

    if (filter.assetId) query.assetId = filter.assetId;
    if (filter.status) query.status = filter.status;

    return AssetAssignment.find(query)
      .populate('assetId', 'assetTag name manufacturer model serialNumber qrCodeReference status')
      .populate('employeeId', 'name email employeeId role')
      .populate('assignedBy', 'name email role')
      .populate('receivedBy', 'name email role')
      .sort({ assignedAt: -1 })
      .lean();
  }

  /**
   * Detect overdue device assignments
   */
  static async getOverdueAssignments(organizationId) {
    const now = new Date();
    return AssetAssignment.find({
      organizationId,
      status: 'Active',
      expectedReturnDate: { $lt: now, $ne: null },
    })
      .populate('assetId', 'assetTag name manufacturer model serialNumber')
      .populate('employeeId', 'name email employeeId phone')
      .sort({ expectedReturnDate: 1 })
      .lean();
  }
}

import { AssignmentService } from '../services/assignment/assignmentService.js';

export async function createAssignment(req, res, next) {
  try {
    const meta = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const assignment = await AssignmentService.assignAsset(
      req.user.organizationId,
      req.body,
      req.user._id,
      meta
    );

    res.status(201).json({
      success: true,
      message: 'Asset assigned successfully',
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

export async function returnAssignment(req, res, next) {
  try {
    const meta = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const result = await AssignmentService.returnAsset(
      req.user.organizationId,
      req.params.id,
      req.body,
      req.user._id,
      meta
    );

    res.status(200).json({
      success: true,
      message: 'Asset returned to available inventory',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function transferAssignment(req, res, next) {
  try {
    const meta = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const newAssignment = await AssignmentService.transferAsset(
      req.user.organizationId,
      req.params.id,
      req.body,
      req.user._id,
      meta
    );

    res.status(200).json({
      success: true,
      message: 'Asset transferred to new custodian',
      data: newAssignment,
    });
  } catch (error) {
    next(error);
  }
}

export async function listAssignments(req, res, next) {
  try {
    const assignments = await AssignmentService.listAssignments(
      req.user.organizationId,
      req.query,
      req.user
    );

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOverdueAssignments(req, res, next) {
  try {
    const overdue = await AssignmentService.getOverdueAssignments(req.user.organizationId);

    res.status(200).json({
      success: true,
      count: overdue.length,
      data: overdue,
    });
  } catch (error) {
    next(error);
  }
}

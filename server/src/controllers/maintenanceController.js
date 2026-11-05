import { MaintenanceService } from '../services/maintenance/maintenanceService.js';

export async function createTicket(req, res, next) {
  try {
    const meta = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const ticket = await MaintenanceService.createTicket(
      req.user.organizationId,
      req.body,
      req.user._id,
      meta
    );

    res.status(201).json({
      success: true,
      message: `Maintenance ticket ${ticket.ticketNumber} created`,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
}

export async function listTickets(req, res, next) {
  try {
    const tickets = await MaintenanceService.listTickets(req.user.organizationId, req.query);
    res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    next(error);
  }
}

export async function getTicketById(req, res, next) {
  try {
    const ticket = await MaintenanceService.getTicketById(req.user.organizationId, req.params.id);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function updateTicket(req, res, next) {
  try {
    const meta = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const ticket = await MaintenanceService.updateTicket(
      req.user.organizationId,
      req.params.id,
      req.body,
      req.user._id,
      meta
    );

    res.status(200).json({
      success: true,
      message: 'Maintenance ticket updated',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
}

export async function logComponentChange(req, res, next) {
  try {
    const meta = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const change = await MaintenanceService.logComponentChange(
      req.user.organizationId,
      req.params.id,
      req.body,
      req.user._id,
      meta
    );

    res.status(201).json({
      success: true,
      message: 'Component evolution record logged and asset specifications synchronized',
      data: change,
    });
  } catch (error) {
    next(error);
  }
}

export async function completeTicket(req, res, next) {
  try {
    const meta = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const ticket = await MaintenanceService.completeTicket(
      req.user.organizationId,
      req.params.id,
      req.body,
      req.user._id,
      meta
    );

    res.status(200).json({
      success: true,
      message: `Repair completed. Asset restored to Available status.`,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
}

import { StockLedgerService } from '../services/inventory/stockLedgerService.js';

export async function createStockItem(req, res, next) {
  try {
    const item = await StockLedgerService.createStockItem(
      req.user.organizationId,
      req.body,
      req.user._id
    );
    res.status(201).json({ success: true, message: 'Stock item registered', data: item });
  } catch (error) {
    next(error);
  }
}

export async function listStockItems(req, res, next) {
  try {
    const items = await StockLedgerService.listStockItems(req.user.organizationId, req.query);
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    next(error);
  }
}

export async function recordStockMovement(req, res, next) {
  try {
    const movement = await StockLedgerService.recordMovement(
      req.user.organizationId,
      req.body,
      req.user._id
    );
    res.status(201).json({
      success: true,
      message: `Stock movement ${movement.movementType} recorded`,
      data: movement,
    });
  } catch (error) {
    next(error);
  }
}

export async function listStockMovements(req, res, next) {
  try {
    const movements = await StockLedgerService.listMovements(req.user.organizationId, req.query);
    res.status(200).json({ success: true, count: movements.length, data: movements });
  } catch (error) {
    next(error);
  }
}

export const USER_ROLES = {
  ADMIN: 'Admin',
  ASSET_MANAGER: 'Asset Manager',
  TECHNICIAN: 'Technician',
  EMPLOYEE: 'Employee',
  AUDITOR: 'Auditor',
};

export const ALL_ROLES = Object.values(USER_ROLES);

export const ASSET_STATUSES = {
  PURCHASED: 'Purchased',
  REGISTERED: 'Registered',
  AVAILABLE: 'Available',
  ASSIGNED: 'Assigned',
  UNDER_REPAIR: 'Under Repair',
  RETIRED: 'Retired',
  LOST: 'Lost',
  DISPOSED: 'Disposed',
};

export const ALL_ASSET_STATUSES = Object.values(ASSET_STATUSES);

export const ASSET_CONDITIONS = {
  NEW: 'New',
  GOOD: 'Good',
  FAIR: 'Fair',
  DAMAGED: 'Damaged',
};

export const ALL_ASSET_CONDITIONS = Object.values(ASSET_CONDITIONS);

export const MAINTENANCE_TYPES = {
  PREVENTIVE: 'Preventive Maintenance',
  CORRECTIVE: 'Corrective Maintenance',
  UPGRADE: 'Hardware Upgrade',
  REPLACEMENT: 'Component Replacement',
  INSPECTION: 'Diagnostic Inspection',
};

export const ALL_MAINTENANCE_TYPES = Object.values(MAINTENANCE_TYPES);

export const MAINTENANCE_PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const ALL_MAINTENANCE_PRIORITIES = Object.values(MAINTENANCE_PRIORITIES);

export const MAINTENANCE_STATUSES = {
  REPORTED: 'Reported',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  WAITING_PARTS: 'Waiting for Parts',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const ALL_MAINTENANCE_STATUSES = Object.values(MAINTENANCE_STATUSES);

export const STOCK_MOVEMENT_TYPES = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUSTMENT: 'ADJUSTMENT',
};

export const ALL_STOCK_MOVEMENT_TYPES = Object.values(STOCK_MOVEMENT_TYPES);

export const DEFAULT_ASSET_CATEGORIES = [
  { name: 'Laptops', code: 'LAP', isHardware: true },
  { name: 'Desktop Computers', code: 'DSK', isHardware: true },
  { name: 'Workstations', code: 'WRK', isHardware: true },
  { name: 'Monitors', code: 'MON', isHardware: false },
  { name: 'Printers', code: 'PRN', isHardware: false },
  { name: 'Routers', code: 'RTR', isHardware: false },
  { name: 'Network Switches', code: 'SWT', isHardware: false },
  { name: 'Access Points', code: 'AP', isHardware: false },
  { name: 'UPS', code: 'UPS', isHardware: false },
  { name: 'Keyboards', code: 'KEY', isHardware: false },
  { name: 'Mice', code: 'MOU', isHardware: false },
  { name: 'Storage Devices', code: 'STR', isHardware: false },
  { name: 'RAM Modules', code: 'RAM', isHardware: false },
  { name: 'Other Peripherals', code: 'OTH', isHardware: false },
];

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { AssetCategory } from '../models/AssetCategory.js';
import { Department } from '../models/Department.js';
import { Location } from '../models/Location.js';
import { Asset } from '../models/Asset.js';
import { AssetAssignment } from '../models/AssetAssignment.js';
import { StockItem } from '../models/StockItem.js';
import { MaintenanceRecord } from '../models/MaintenanceRecord.js';
import { TaxonomyService } from '../services/taxonomy/taxonomyService.js';
import { generateUniqueAssetTag, generateOpaqueQRToken } from '../services/asset/tagGenerator.js';
import { QRService } from '../services/qr/qrService.js';
import { env } from '../config/env.js';

export async function seedDemoDatabase() {
  await mongoose.connect(env.MONGODB_URI);

  await Organization.deleteMany({ code: 'TESTIT' });
  await User.deleteMany({ email: { $regex: /@testitcorp\.com$/i } });
  await Asset.deleteMany({ serialNumber: { $regex: /DL7440|HP-Z4|FOC1234/i } });
  await StockItem.deleteMany({ itemCode: { $in: ['RAM-DDR5-16G-5600', 'SSD-NVME-1TB-990P'] } });

  console.log('Seeding demo enterprise data for AssetTrack...');

  // 1. Create Organization
  const org = await Organization.create({
    name: 'Test IT Corp',
    code: 'TESTIT',
    contactEmail: 'admin@testitcorp.com',
    assetTagPrefix: 'TIT',
    isActive: true,
  });

  // 3. Create Users matching LoginPage.jsx Demo Quick-Fills
  const admin = await User.create({
    organizationId: org._id,
    name: 'Root Administrator',
    email: 'admin@testitcorp.com',
    password: 'AdminPassword123!',
    role: 'Admin',
    employeeId: 'EMP-ADM-001',
    isActive: true,
  });

  const tech = await User.create({
    organizationId: org._id,
    name: 'John Technician',
    email: 'john.tech@testitcorp.com',
    password: 'TechPassword123!',
    role: 'Technician',
    employeeId: 'EMP-TCH-002',
    isActive: true,
  });

  const emp = await User.create({
    organizationId: org._id,
    name: 'Alice Employee',
    email: 'alice.emp@testitcorp.com',
    password: 'EmpPassword123!',
    role: 'Employee',
    employeeId: 'EMP-DEV-003',
    isActive: true,
  });

  const auditor = await User.create({
    organizationId: org._id,
    name: 'Robert Auditor',
    email: 'auditor@testitcorp.com',
    password: 'AuditorPass123!',
    role: 'Auditor',
    employeeId: 'EMP-AUD-004',
    isActive: true,
  });

  // 4. Seed Default 14 Categories
  await TaxonomyService.listCategories(org._id);
  const laptopCat = await AssetCategory.findOne({ organizationId: org._id, code: 'LAP' });
  const desktopCat = await AssetCategory.findOne({ organizationId: org._id, code: 'DSK' });
  const serverCat = await AssetCategory.findOne({ organizationId: org._id, code: 'SVR' });
  const switchCat = await AssetCategory.findOne({ organizationId: org._id, code: 'SWT' });

  // 5. Create Departments
  const devDept = await Department.create({
    organizationId: org._id,
    name: 'Software Engineering',
    code: 'ENG',
  });
  const infraDept = await Department.create({
    organizationId: org._id,
    name: 'IT Infrastructure',
    code: 'INFRA',
  });
  const secDept = await Department.create({
    organizationId: org._id,
    name: 'Security Operations',
    code: 'SECOPS',
  });

  // 6. Create Locations
  const loc1 = await Location.create({
    organizationId: org._id,
    building: 'Building Alpha',
    floor: 'Floor 3',
    room: 'Engineering Lab 301',
  });
  const loc2 = await Location.create({
    organizationId: org._id,
    building: 'Building Beta',
    floor: 'Floor 1',
    room: 'Core Server Room 102',
  });

  // 7. Create Sample Assets
  const tag1 = await generateUniqueAssetTag(org._id, 'TIT');
  const qrToken1 = generateOpaqueQRToken(org.code, tag1);
  const qrImage1 = await QRService.generateQRCodeDataUrl(qrToken1);

  const asset1 = await Asset.create({
    organizationId: org._id,
    assetTag: tag1,
    qrCodeReference: qrToken1,
    name: 'Dell Latitude 7440 Ultrabook',
    categoryId: laptopCat._id,
    manufacturer: 'Dell',
    model: 'Latitude 7440',
    serialNumber: 'DL7440-2026-X01',
    status: 'Assigned',
    condition: 'New',
    locationId: loc1._id,
    departmentId: devDept._id,
    assignedTo: emp._id,
    purchaseCostMinor: 11500000,
    warrantyExpiry: new Date('2027-08-30'),
    specifications: {
      cpu: { manufacturer: 'Intel', model: 'Core i7-1365U', cores: 10, threads: 12, baseClockGhz: 1.8, boostClockGhz: 5.2 },
      ram: {
        totalCapacityGb: 32,
        modules: [{ slot: 1, capacityGb: 16, speedMts: 5200, make: 'Crucial' }, { slot: 2, capacityGb: 16, speedMts: 5200, make: 'Crucial' }]
      },
      storage: [{ capacityGb: 1000, driveType: 'NVMe SSD', manufacturer: 'Samsung', serialNumber: 'S677NF0W11' }],
      operatingSystem: { name: 'Ubuntu Linux', version: '24.04 LTS' },
      networking: { macAddress: '00:1A:2B:3C:4D:5E', ipAddress: '192.168.1.105' },
    },
  });

  // Custody Assignment for Asset 1
  await AssetAssignment.create({
    organizationId: org._id,
    assetId: asset1._id,
    employeeId: emp._id,
    assignedBy: admin._id,
    conditionAtHandover: 'Good',
    expectedReturnDate: new Date('2026-12-31'),
    accessories: [
      { name: '65W USB-C Charger', verified: true },
      { name: 'Dell EcoLoop Pro Backpack', verified: true },
    ],
    status: 'Active',
    notes: 'Standard engineering deployment',
  });

  // Asset 2: Available Desktop
  const tag2 = await generateUniqueAssetTag(org._id, 'TIT');
  const qrToken2 = generateOpaqueQRToken(org.code, tag2);
  await Asset.create({
    organizationId: org._id,
    assetTag: tag2,
    qrCodeReference: qrToken2,
    name: 'HP Z4 G5 Workstation',
    categoryId: desktopCat._id,
    manufacturer: 'HP',
    model: 'Z4 G5',
    serialNumber: 'HP-Z4-889900',
    status: 'Available',
    condition: 'Good',
    locationId: loc1._id,
    departmentId: devDept._id,
    purchaseCostMinor: 18500000,
    warrantyExpiry: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // Expiring in 45 days
    specifications: {
      cpu: { manufacturer: 'Intel', model: 'Xeon W-2423', cores: 6, threads: 12 },
      ram: { totalCapacityGb: 64, modules: [{ slot: 1, capacityGb: 32, speedMts: 4800, make: 'Micron' }, { slot: 2, capacityGb: 32, speedMts: 4800, make: 'Micron' }] },
      storage: [{ capacityGb: 2000, driveType: 'NVMe SSD', manufacturer: 'Crucial', serialNumber: 'CT2000P3' }],
    },
  });

  // Asset 3: Under Repair Switch
  const tag3 = await generateUniqueAssetTag(org._id, 'TIT');
  const qrToken3 = generateOpaqueQRToken(org.code, tag3);
  const asset3 = await Asset.create({
    organizationId: org._id,
    assetTag: tag3,
    qrCodeReference: qrToken3,
    name: 'Cisco Catalyst 2960-X Switch',
    categoryId: switchCat._id,
    manufacturer: 'Cisco',
    model: 'WS-C2960X-48TS-L',
    serialNumber: 'FOC1234X567',
    status: 'Under Repair',
    condition: 'Damaged',
    locationId: loc2._id,
    departmentId: infraDept._id,
    purchaseCostMinor: 9500000,
    warrantyExpiry: new Date('2028-01-15'),
  });

  // Maintenance Ticket for Asset 3
  await MaintenanceRecord.create({
    organizationId: org._id,
    assetId: asset3._id,
    ticketNumber: 'MNT-2026-0001',
    reportedBy: admin._id,
    technicianId: tech._id,
    maintenanceType: 'Corrective Maintenance',
    priority: 'High',
    status: 'In Progress',
    issueDescription: 'Fan failure on exhaust port 2 causing thermal shutdown',
  });

  // 8. Create Spare Parts Stock
  await StockItem.create({
    organizationId: org._id,
    itemCode: 'RAM-DDR5-16G-5600',
    name: 'Crucial 16GB DDR5 5600MT/s SODIMM',
    category: 'RAM',
    unit: 'pcs',
    currentQuantity: 8,
    minStockLevel: 3,
    unitCostMinor: 480000,
    location: 'Bin A-1',
  });

  await StockItem.create({
    organizationId: org._id,
    itemCode: 'SSD-NVME-1TB-990P',
    name: 'Samsung 990 PRO 1TB PCIe 4.0 NVMe',
    category: 'SSD',
    unit: 'pcs',
    currentQuantity: 2, // Low stock breach (min is 5)
    minStockLevel: 5,
    unitCostMinor: 1100000,
    location: 'Bin B-4',
  });

  console.log('✅ Demo database seeded successfully for Test IT Corp (TESTIT)');
  await mongoose.disconnect();
}

if (process.argv[1]?.endsWith('seedDemo.js')) {
  seedDemoDatabase().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

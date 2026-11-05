import crypto from 'crypto';
import { Asset } from '../../models/Asset.js';
import { Organization } from '../../models/Organization.js';

export async function generateUniqueAssetTag(organizationId) {
  const org = await Organization.findById(organizationId);
  const prefix = (org?.settings?.assetTagPrefix || 'AT').toUpperCase();
  const year = new Date().getFullYear();

  // Find the highest sequence number for this prefix and year
  const regex = new RegExp(`^${prefix}-${year}-(\\d{4,})$`);
  const latestAsset = await Asset.findOne({
    organizationId,
    assetTag: regex,
  })
    .sort({ assetTag: -1 })
    .lean();

  let nextSeq = 1;
  if (latestAsset && latestAsset.assetTag) {
    const match = latestAsset.assetTag.match(regex);
    if (match && match[1]) {
      nextSeq = parseInt(match[1], 10) + 1;
    }
  }

  const paddedSeq = String(nextSeq).padStart(4, '0');
  let proposedTag = `${prefix}-${year}-${paddedSeq}`;

  // Double check uniqueness (handle any concurrent race condition)
  let collision = await Asset.findOne({ organizationId, assetTag: proposedTag });
  while (collision) {
    nextSeq++;
    proposedTag = `${prefix}-${year}-${String(nextSeq).padStart(4, '0')}`;
    collision = await Asset.findOne({ organizationId, assetTag: proposedTag });
  }

  return proposedTag;
}

export function generateOpaqueQRToken(orgCode, assetTag) {
  const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  const sanitizedTag = assetTag.replace(/[^A-Za-z0-9]/g, '');
  return `Q-${orgCode}-${sanitizedTag}-${randomSuffix}`;
}

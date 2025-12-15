// =============================================================================
// Azure CAF Naming Conventions for AVD Resources
// =============================================================================

import { getRegionShortCode } from './regions';

// Resource type prefixes (Azure CAF compliant)
export const RESOURCE_PREFIXES = {
  hostPool: 'vdpool',
  applicationGroup: 'vdag',
  workspace: 'vdws',
  scalingPlan: 'vdscaling',
  virtualMachine: 'vm',
  networkInterface: 'nic',
  osDisk: 'osdisk',
  resourceGroup: 'rg',
  storageAccount: 'st',
  keyVault: 'kv',
} as const;

// Environment short codes
export const ENVIRONMENT_CODES = {
  DEVELOPMENT: 'd',
  STAGING: 't', // 't' for test/staging
  PRODUCTION: 'p',
} as const;

// Naming pattern tokens
export const NAMING_TOKENS = {
  PREFIX: '{prefix}',
  BU: '{bu}',
  ENV: '{env}',
  REGION: '{region}',
  SEQ: '{seq}',
  TYPE: '{type}',
} as const;

// Default naming patterns
export const DEFAULT_NAMING_PATTERNS = {
  hostPool: 'vdpool-{bu}-{env}-{region}',
  applicationGroup: 'vdag-{bu}-{env}-{type}',
  workspace: 'vdws-{bu}-{env}',
  virtualMachine: 'vm{bu}{env}{region}{seq}',
  resourceGroup: 'rg-avd-{bu}-{env}-{region}',
} as const;

export interface NamingContext {
  businessUnitCode: string;
  environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
  region: string;
  sequence?: number;
  type?: 'desktop' | 'remoteapp';
}

/**
 * Generate a host pool name following Azure CAF conventions
 */
export const generateHostPoolName = (ctx: NamingContext): string => {
  const bu = ctx.businessUnitCode.toLowerCase();
  const env = ENVIRONMENT_CODES[ctx.environment];
  const region = getRegionShortCode(ctx.region);
  return `vdpool-${bu}-${env}-${region}`;
};

/**
 * Generate an application group name
 */
export const generateAppGroupName = (ctx: NamingContext): string => {
  const bu = ctx.businessUnitCode.toLowerCase();
  const env = ENVIRONMENT_CODES[ctx.environment];
  const type = ctx.type || 'desktop';
  return `vdag-${bu}-${env}-${type}`;
};

/**
 * Generate a workspace name
 */
export const generateWorkspaceName = (ctx: NamingContext): string => {
  const bu = ctx.businessUnitCode.toLowerCase();
  const env = ENVIRONMENT_CODES[ctx.environment];
  return `vdws-${bu}-${env}`;
};

/**
 * Generate a VM name pattern
 * Note: VMs have 15 char limit, so we use compact format
 */
export const generateVMNamePattern = (ctx: NamingContext): string => {
  const bu = ctx.businessUnitCode.toLowerCase().substring(0, 3);
  const env = ENVIRONMENT_CODES[ctx.environment];
  const region = getRegionShortCode(ctx.region).substring(0, 3);
  return `vm${bu}${env}${region}{###}`;
};

/**
 * Generate a resource group name
 */
export const generateResourceGroupName = (ctx: NamingContext, purpose: string = 'pool'): string => {
  const bu = ctx.businessUnitCode.toLowerCase();
  const env = ENVIRONMENT_CODES[ctx.environment];
  const region = getRegionShortCode(ctx.region);
  return `rg-avd-${bu}-${env}-${region}-${purpose}`;
};

/**
 * Parse a naming pattern and replace tokens with values
 */
export const applyNamingPattern = (
  pattern: string,
  ctx: NamingContext
): string => {
  const bu = ctx.businessUnitCode.toLowerCase();
  const env = ENVIRONMENT_CODES[ctx.environment];
  const region = getRegionShortCode(ctx.region);
  const seq = ctx.sequence?.toString().padStart(3, '0') || '001';
  const type = ctx.type || 'desktop';

  return pattern
    .replace(/\{bu\}/gi, bu)
    .replace(/\{env\}/gi, env)
    .replace(/\{region\}/gi, region)
    .replace(/\{seq\}/gi, seq)
    .replace(/\{###\}/gi, seq)
    .replace(/\{type\}/gi, type);
};

/**
 * Validate a naming convention string
 * Returns errors if invalid
 */
export const validateNamingConvention = (name: string): string[] => {
  const errors: string[] = [];

  // Check length (Azure resource names have limits)
  if (name.length > 64) {
    errors.push('Name exceeds 64 character limit');
  }

  // Check for invalid characters
  if (!/^[a-z0-9-]+$/.test(name)) {
    errors.push('Name must contain only lowercase letters, numbers, and hyphens');
  }

  // Check for starting/ending with hyphen
  if (name.startsWith('-') || name.endsWith('-')) {
    errors.push('Name cannot start or end with a hyphen');
  }

  // Check for consecutive hyphens
  if (/--/.test(name)) {
    errors.push('Name cannot contain consecutive hyphens');
  }

  return errors;
};

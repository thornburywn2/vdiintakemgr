// =============================================================================
// AVD Template Management Portal - Zod Validation Schemas
// =============================================================================

import { z } from 'zod';

// =============================================================================
// Authentication
// =============================================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// =============================================================================
// Business Units
// =============================================================================

export const createBusinessUnitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string()
    .min(2, 'Code must be at least 2 characters')
    .max(20)
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase letters, numbers, and hyphens'),
  description: z.string().max(500).optional().nullable(),
  isVendor: z.boolean().default(false),
  vendorCompany: z.string().max(200).optional().nullable(),
  costCenter: z.string().max(50).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateBusinessUnitSchema = createBusinessUnitSchema.partial();

// =============================================================================
// Contacts
// =============================================================================

export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  title: z.string().max(100).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  isPrimary: z.boolean().default(false),
  businessUnitId: z.string().cuid('Invalid business unit'),
});

export const updateContactSchema = createContactSchema.partial().omit({ businessUnitId: true });

// =============================================================================
// Applications
// =============================================================================

export const createApplicationSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Name must be lowercase letters, numbers, and hyphens'),
  displayName: z.string().min(1, 'Display name is required').max(200),
  version: z.string().max(50).optional().nullable(),
  publisher: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  isMsixAppAttach: z.boolean().default(false),
  msixPackagePath: z.string().max(500).optional().nullable(),
  msixImagePath: z.string().max(500).optional().nullable(),
  msixCertificate: z.string().max(100).optional().nullable(),
  licenseRequired: z.boolean().default(false),
  licenseType: z.string().max(50).optional().nullable(),
  licenseVendor: z.string().max(200).optional().nullable(),
  licenseSku: z.string().max(100).optional().nullable(),
  licenseCost: z.number().nonnegative().optional().nullable(),
  licenseNotes: z.string().max(2000).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  installCommand: z.string().max(1000).optional().nullable(),
  uninstallCommand: z.string().max(1000).optional().nullable(),
  installSize: z.string().max(50).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateApplicationSchema = createApplicationSchema.partial();

// =============================================================================
// Templates
// =============================================================================

export const templateStatusEnum = z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'DEPLOYED', 'DEPRECATED']);
export const environmentEnum = z.enum(['PILOT', 'DEVELOPMENT', 'STAGING', 'PRODUCTION']);
export const hostPoolTypeEnum = z.enum(['POOLED', 'PERSONAL']);
export const loadBalancerTypeEnum = z.enum(['BREADTH_FIRST', 'DEPTH_FIRST']);
export const appApprovalStatusEnum = z.enum(['PENDING', 'APPROVED', 'DENIED']);

export const azureTagsSchema = z.record(z.string(), z.string()).optional().nullable();

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(5000).optional().nullable(),

  // Business Unit & Contact
  businessUnitId: z.string().cuid('Invalid business unit'),
  contactId: z.string().cuid('Invalid contact').optional().nullable(),

  // Freeform Contact Info (optional - used instead of contactId)
  contactName: z.string().max(100).optional().nullable(),
  contactEmail: z.string().email('Invalid email address').max(200).optional().nullable(),
  contactTitle: z.string().max(100).optional().nullable(),

  // Naming Convention
  namingPrefix: z.string()
    .min(1, 'Naming prefix is required')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Prefix must be lowercase letters, numbers, and hyphens'),
  namingPattern: z.string().max(100).optional().nullable(),
  environment: environmentEnum.default('PILOT'),

  // Host Pool Configuration
  hostPoolType: hostPoolTypeEnum.default('POOLED'),
  maxSessionLimit: z.number().int().min(1).max(999999).optional().nullable(),
  loadBalancerType: loadBalancerTypeEnum.default('BREADTH_FIRST'),
  validationEnvEnabled: z.boolean().default(false),

  // Regions
  regions: z.array(z.string()).min(1, 'At least one region is required'),
  primaryRegion: z.string().min(1, 'Primary region is required'),

  // Base Image
  baseImageId: z.string().cuid('Invalid base image').optional().nullable(),

  // Tags & Notes
  tags: azureTagsSchema,
  notes: z.string().max(10000).optional().nullable(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const updateTemplateStatusSchema = z.object({
  status: templateStatusEnum,
  comment: z.string().max(1000).optional(),
});

// =============================================================================
// Template Applications
// =============================================================================

export const addTemplateApplicationSchema = z.object({
  applicationId: z.string().cuid('Invalid application'),
  versionOverride: z.string().max(50).optional().nullable(),
  installNotes: z.string().max(2000).optional().nullable(),
  approvalStatus: appApprovalStatusEnum.default('PENDING'),
  approvalNotes: z.string().max(2000).optional().nullable(),
  isRequired: z.boolean().default(true),
  installOrder: z.number().int().min(0).default(0),
});

export const updateTemplateApplicationSchema = addTemplateApplicationSchema.partial().omit({ applicationId: true });

export const reorderApplicationsSchema = z.object({
  applications: z.array(z.object({
    applicationId: z.string().cuid(),
    installOrder: z.number().int().min(0),
  })),
});

// =============================================================================
// Query Parameters
// =============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const templateQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  status: templateStatusEnum.optional(),
  environment: environmentEnum.optional(),
  businessUnitId: z.string().cuid().optional(),
  region: z.string().optional(),
  sortBy: z.enum(['name', 'requestDate', 'lastModifiedDate', 'status']).default('lastModifiedDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const applicationQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  category: z.string().optional(),
  isMsixAppAttach: z.coerce.boolean().optional(),
  licenseRequired: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const auditLogQuerySchema = paginationSchema.extend({
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  adminId: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// =============================================================================
// Type Inference
// =============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateBusinessUnitInput = z.infer<typeof createBusinessUnitSchema>;
export type UpdateBusinessUnitInput = z.infer<typeof updateBusinessUnitSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type UpdateTemplateStatusInput = z.infer<typeof updateTemplateStatusSchema>;
export type AddTemplateApplicationInput = z.infer<typeof addTemplateApplicationSchema>;
export type TemplateQueryInput = z.infer<typeof templateQuerySchema>;
export type ApplicationQueryInput = z.infer<typeof applicationQuerySchema>;
export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;

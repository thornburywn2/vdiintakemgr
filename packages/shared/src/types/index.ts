// =============================================================================
// AVD Template Management Portal - Type Definitions
// =============================================================================

// Enums (matching Prisma schema)
export type TemplateStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'DEPLOYED' | 'DEPRECATED';
export type Environment = 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
export type HostPoolType = 'POOLED' | 'PERSONAL';
export type LoadBalancerType = 'BREADTH_FIRST' | 'DEPTH_FIRST';

// Admin User
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

// Business Unit
export interface BusinessUnit {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isVendor: boolean;
  vendorCompany: string | null;
  costCenter: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Contact
export interface Contact {
  id: string;
  name: string;
  email: string;
  title: string | null;
  department: string | null;
  phone: string | null;
  isPrimary: boolean;
  businessUnitId: string;
  businessUnit?: BusinessUnit;
  createdAt: string;
  updatedAt: string;
}

// Application
export interface Application {
  id: string;
  name: string;
  displayName: string;
  version: string | null;
  publisher: string | null;
  description: string | null;
  isMsixAppAttach: boolean;
  msixPackagePath: string | null;
  msixImagePath: string | null;
  msixCertificate: string | null;
  licenseRequired: boolean;
  licenseType: string | null;
  licenseVendor: string | null;
  licenseSku: string | null;
  licenseCost: number | null;
  licenseNotes: string | null;
  category: string | null;
  installCommand: string | null;
  uninstallCommand: string | null;
  installSize: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Template Application (junction)
export interface TemplateApplication {
  id: string;
  templateId: string;
  applicationId: string;
  application?: Application;
  versionOverride: string | null;
  installNotes: string | null;
  isRequired: boolean;
  installOrder: number;
  createdAt: string;
}

// Azure Tags
export interface AzureTags {
  environment?: string;
  costCenter?: string;
  owner?: string;
  businessUnit?: string;
  application?: string;
  managedBy?: string;
  [key: string]: string | undefined;
}

// Template
export interface Template {
  id: string;
  name: string;
  description: string | null;
  status: TemplateStatus;
  requestDate: string;
  lastModifiedDate: string;
  approvedDate: string | null;
  deployedDate: string | null;
  deprecatedDate: string | null;
  businessUnitId: string;
  businessUnit?: BusinessUnit;
  contactId: string;
  contact?: Contact;
  namingPrefix: string;
  namingPattern: string | null;
  environment: Environment;
  hostPoolType: HostPoolType;
  maxSessionLimit: number | null;
  loadBalancerType: LoadBalancerType;
  validationEnvEnabled: boolean;
  regions: string[];
  primaryRegion: string;
  goldenImageName: string | null;
  baseOS: string | null;
  imageVersion: string | null;
  patchLevel: string | null;
  lastSysprepDate: string | null;
  computeGalleryId: string | null;
  imageDefinition: string | null;
  subscriptionId: string | null;
  resourceGroup: string | null;
  hostPoolId: string | null;
  workspaceId: string | null;
  appGroupId: string | null;
  tags: AzureTags | null;
  notes: string | null;
  createdById: string;
  createdBy?: AdminUser;
  updatedById: string | null;
  updatedBy?: AdminUser | null;
  applications?: TemplateApplication[];
  createdAt: string;
  updatedAt: string;
}

// Template History
export interface TemplateHistory {
  id: string;
  templateId: string;
  action: string;
  oldStatus: TemplateStatus | null;
  newStatus: TemplateStatus | null;
  changes: Record<string, unknown> | null;
  comment: string | null;
  userId: string;
  userName: string | null;
  createdAt: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  adminId: string;
  admin?: AdminUser;
  action: string;
  entityType: string | null;
  entityId: string | null;
  entityName: string | null;
  details: Record<string, unknown> | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

// Dashboard Stats
export interface DashboardStats {
  total: number;
  draft: number;
  inReview: number;
  approved: number;
  deployed: number;
  deprecated: number;
  totalApplications: number;
  totalBusinessUnits: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AdminUser;
}

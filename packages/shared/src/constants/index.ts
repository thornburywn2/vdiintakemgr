// =============================================================================
// AVD Template Management Portal - Constants
// =============================================================================

// Re-export all constants
export * from './regions';
export * from './naming';
export * from './categories';

// Template Status options
export const TEMPLATE_STATUSES = [
  { value: 'DRAFT', label: 'Draft', color: 'gray' },
  { value: 'IN_REVIEW', label: 'In Review', color: 'yellow' },
  { value: 'APPROVED', label: 'Approved', color: 'blue' },
  { value: 'DEPLOYED', label: 'Deployed', color: 'green' },
  { value: 'DEPRECATED', label: 'Deprecated', color: 'red' },
] as const;

// Environment options
export const ENVIRONMENTS = [
  { value: 'DEVELOPMENT', label: 'Development', shortCode: 'dev' },
  { value: 'STAGING', label: 'Staging', shortCode: 'stg' },
  { value: 'PRODUCTION', label: 'Production', shortCode: 'prod' },
] as const;

// Host Pool Types
export const HOST_POOL_TYPES = [
  { value: 'POOLED', label: 'Pooled', description: 'Non-persistent desktops shared among users' },
  { value: 'PERSONAL', label: 'Personal', description: 'Persistent desktops assigned to specific users' },
] as const;

// Load Balancer Types
export const LOAD_BALANCER_TYPES = [
  { value: 'BREADTH_FIRST', label: 'Breadth-first', description: 'Distributes sessions evenly across hosts' },
  { value: 'DEPTH_FIRST', label: 'Depth-first', description: 'Fills one host before moving to next' },
] as const;

// License Types
export const LICENSE_TYPES = [
  'Per User',
  'Per Device',
  'Enterprise Agreement',
  'Microsoft 365',
  'Volume License',
  'Subscription',
  'Open Source',
  'Freeware',
] as const;

// Default Azure Tags
export const DEFAULT_AZURE_TAGS = [
  { key: 'environment', description: 'Deployment environment (production, staging, development)' },
  { key: 'costCenter', description: 'Cost allocation code' },
  { key: 'owner', description: 'Team or individual responsible' },
  { key: 'businessUnit', description: 'Business unit name' },
  { key: 'application', description: 'Primary application name' },
  { key: 'managedBy', description: 'Management tool (AVDManager)' },
  { key: 'createdDate', description: 'Resource creation date' },
] as const;

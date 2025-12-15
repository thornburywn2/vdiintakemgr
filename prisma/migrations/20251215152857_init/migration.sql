-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'DEPLOYED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('DEVELOPMENT', 'STAGING', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "HostPoolType" AS ENUM ('POOLED', 'PERSONAL');

-- CreateEnum
CREATE TYPE "LoadBalancerType" AS ENUM ('BREADTH_FIRST', 'DEPTH_FIRST');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isVendor" BOOLEAN NOT NULL DEFAULT false,
    "vendorCompany" TEXT,
    "costCenter" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "title" TEXT,
    "department" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "businessUnitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModifiedDate" TIMESTAMP(3) NOT NULL,
    "approvedDate" TIMESTAMP(3),
    "deployedDate" TIMESTAMP(3),
    "deprecatedDate" TIMESTAMP(3),
    "businessUnitId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "namingPrefix" TEXT NOT NULL,
    "namingPattern" TEXT,
    "environment" "Environment" NOT NULL DEFAULT 'PRODUCTION',
    "hostPoolType" "HostPoolType" NOT NULL DEFAULT 'POOLED',
    "maxSessionLimit" INTEGER DEFAULT 10,
    "loadBalancerType" "LoadBalancerType" NOT NULL DEFAULT 'BREADTH_FIRST',
    "validationEnvEnabled" BOOLEAN NOT NULL DEFAULT false,
    "regions" TEXT[],
    "primaryRegion" TEXT NOT NULL,
    "goldenImageName" TEXT,
    "baseOS" TEXT,
    "imageVersion" TEXT,
    "patchLevel" TEXT,
    "lastSysprepDate" TIMESTAMP(3),
    "computeGalleryId" TEXT,
    "imageDefinition" TEXT,
    "subscriptionId" TEXT,
    "resourceGroup" TEXT,
    "hostPoolId" TEXT,
    "workspaceId" TEXT,
    "appGroupId" TEXT,
    "tags" JSONB,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "version" TEXT,
    "publisher" TEXT,
    "description" TEXT,
    "isMsixAppAttach" BOOLEAN NOT NULL DEFAULT false,
    "msixPackagePath" TEXT,
    "msixImagePath" TEXT,
    "msixCertificate" TEXT,
    "licenseRequired" BOOLEAN NOT NULL DEFAULT false,
    "licenseType" TEXT,
    "licenseVendor" TEXT,
    "licenseSku" TEXT,
    "licenseCost" DOUBLE PRECISION,
    "licenseNotes" TEXT,
    "category" TEXT,
    "installCommand" TEXT,
    "uninstallCommand" TEXT,
    "installSize" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_applications" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "versionOverride" TEXT,
    "installNotes" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "installOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_history" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldStatus" "TemplateStatus",
    "newStatus" "TemplateStatus",
    "changes" JSONB,
    "comment" TEXT,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "entityName" TEXT,
    "details" JSONB,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "business_units_name_key" ON "business_units"("name");

-- CreateIndex
CREATE UNIQUE INDEX "business_units_code_key" ON "business_units"("code");

-- CreateIndex
CREATE INDEX "business_units_code_idx" ON "business_units"("code");

-- CreateIndex
CREATE INDEX "business_units_isVendor_idx" ON "business_units"("isVendor");

-- CreateIndex
CREATE INDEX "business_units_isActive_idx" ON "business_units"("isActive");

-- CreateIndex
CREATE INDEX "contacts_businessUnitId_idx" ON "contacts"("businessUnitId");

-- CreateIndex
CREATE INDEX "contacts_email_idx" ON "contacts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_email_businessUnitId_key" ON "contacts"("email", "businessUnitId");

-- CreateIndex
CREATE INDEX "templates_status_idx" ON "templates"("status");

-- CreateIndex
CREATE INDEX "templates_businessUnitId_idx" ON "templates"("businessUnitId");

-- CreateIndex
CREATE INDEX "templates_contactId_idx" ON "templates"("contactId");

-- CreateIndex
CREATE INDEX "templates_environment_idx" ON "templates"("environment");

-- CreateIndex
CREATE INDEX "templates_primaryRegion_idx" ON "templates"("primaryRegion");

-- CreateIndex
CREATE INDEX "templates_createdAt_idx" ON "templates"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "applications_name_key" ON "applications"("name");

-- CreateIndex
CREATE INDEX "applications_name_idx" ON "applications"("name");

-- CreateIndex
CREATE INDEX "applications_category_idx" ON "applications"("category");

-- CreateIndex
CREATE INDEX "applications_isMsixAppAttach_idx" ON "applications"("isMsixAppAttach");

-- CreateIndex
CREATE INDEX "applications_isActive_idx" ON "applications"("isActive");

-- CreateIndex
CREATE INDEX "template_applications_templateId_idx" ON "template_applications"("templateId");

-- CreateIndex
CREATE INDEX "template_applications_applicationId_idx" ON "template_applications"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "template_applications_templateId_applicationId_key" ON "template_applications"("templateId", "applicationId");

-- CreateIndex
CREATE INDEX "template_history_templateId_idx" ON "template_history"("templateId");

-- CreateIndex
CREATE INDEX "template_history_action_idx" ON "template_history"("action");

-- CreateIndex
CREATE INDEX "template_history_createdAt_idx" ON "template_history"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_adminId_idx" ON "audit_logs"("adminId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_idx" ON "audit_logs"("entityType");

-- CreateIndex
CREATE INDEX "audit_logs_entityId_idx" ON "audit_logs"("entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- CreateIndex
CREATE INDEX "system_config_category_idx" ON "system_config"("category");

-- CreateIndex
CREATE INDEX "system_config_key_idx" ON "system_config"("key");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_businessUnitId_fkey" FOREIGN KEY ("businessUnitId") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_applications" ADD CONSTRAINT "template_applications_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_applications" ADD CONSTRAINT "template_applications_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_history" ADD CONSTRAINT "template_history_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

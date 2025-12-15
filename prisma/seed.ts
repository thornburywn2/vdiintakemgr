import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean up existing data in correct order (respecting foreign keys)
  console.log('Cleaning up existing data...');
  await prisma.templateApplication.deleteMany({});
  await prisma.templateHistory.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.template.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.businessUnit.deleteMany({});
  await prisma.session.deleteMany({});

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      name: 'Administrator',
    },
  });
  console.log('Created admin user:', admin.email);

  // Create business units
  const businessUnits = await Promise.all([
    prisma.businessUnit.upsert({
      where: { code: 'FIN' },
      update: {},
      create: {
        name: 'Finance',
        code: 'FIN',
        description: 'Finance and Accounting Department',
        costCenter: 'CC-1001',
        isVendor: false,
      },
    }),
    prisma.businessUnit.upsert({
      where: { code: 'HR' },
      update: {},
      create: {
        name: 'Human Resources',
        code: 'HR',
        description: 'HR and Talent Management',
        costCenter: 'CC-1002',
        isVendor: false,
      },
    }),
    prisma.businessUnit.upsert({
      where: { code: 'IT' },
      update: {},
      create: {
        name: 'Information Technology',
        code: 'IT',
        description: 'IT Infrastructure and Development',
        costCenter: 'CC-1003',
        isVendor: false,
      },
    }),
    prisma.businessUnit.upsert({
      where: { code: 'MKTG' },
      update: {},
      create: {
        name: 'Marketing',
        code: 'MKTG',
        description: 'Marketing and Communications',
        costCenter: 'CC-1004',
        isVendor: false,
      },
    }),
    prisma.businessUnit.upsert({
      where: { code: 'VNDR-ACME' },
      update: {},
      create: {
        name: 'Acme Consulting',
        code: 'VNDR-ACME',
        description: 'External consulting vendor',
        costCenter: 'CC-9001',
        isVendor: true,
      },
    }),
    prisma.businessUnit.upsert({
      where: { code: 'VNDR-TECH' },
      update: {},
      create: {
        name: 'TechPartners Inc',
        code: 'VNDR-TECH',
        description: 'Technology contractor vendor',
        costCenter: 'CC-9002',
        isVendor: true,
      },
    }),
  ]);
  console.log('Created', businessUnits.length, 'business units');

  // Create contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        name: 'John Smith',
        email: 'john.smith@company.com',
        phone: '+1-555-0101',
        department: 'Finance',
        title: 'Finance Manager',
        businessUnitId: businessUnits[0].id,
      },
    }),
    prisma.contact.create({
      data: {
        name: 'Sarah Jones',
        email: 'sarah.jones@company.com',
        phone: '+1-555-0102',
        department: 'Human Resources',
        title: 'HR Director',
        businessUnitId: businessUnits[1].id,
      },
    }),
    prisma.contact.create({
      data: {
        name: 'Mike Wilson',
        email: 'mike.wilson@company.com',
        phone: '+1-555-0103',
        department: 'IT',
        title: 'Infrastructure Lead',
        businessUnitId: businessUnits[2].id,
      },
    }),
    prisma.contact.create({
      data: {
        name: 'Lisa Chen',
        email: 'lisa.chen@company.com',
        phone: '+1-555-0104',
        department: 'Marketing',
        title: 'Marketing Manager',
        businessUnitId: businessUnits[3].id,
      },
    }),
    prisma.contact.create({
      data: {
        name: 'Bob Anderson',
        email: 'vendor.contact@acme.com',
        phone: '+1-555-0201',
        department: 'Operations',
        title: 'Account Manager',
        businessUnitId: businessUnits[4].id,
      },
    }),
  ]);
  console.log('Created', contacts.length, 'contacts');

  // Create applications
  const applications = await Promise.all([
    prisma.application.create({
      data: {
        name: 'office365',
        displayName: 'Microsoft Office 365',
        version: '16.0.17231',
        category: 'Productivity',
        publisher: 'Microsoft Corporation',
        description: 'Office productivity suite including Word, Excel, PowerPoint, Outlook',
        isMsixAppAttach: true,
        licenseType: 'Per User',
        licenseRequired: true,
      },
    }),
    prisma.application.create({
      data: {
        name: 'chrome',
        displayName: 'Google Chrome',
        version: '120.0.6099',
        category: 'Browser',
        publisher: 'Google LLC',
        description: 'Modern web browser',
        isMsixAppAttach: false,
      },
    }),
    prisma.application.create({
      data: {
        name: 'edge',
        displayName: 'Microsoft Edge',
        version: '120.0.2210',
        category: 'Browser',
        publisher: 'Microsoft Corporation',
        description: 'Chromium-based web browser',
        isMsixAppAttach: true,
      },
    }),
    prisma.application.create({
      data: {
        name: 'acrobat-reader',
        displayName: 'Adobe Acrobat Reader DC',
        version: '23.008.20470',
        category: 'Productivity',
        publisher: 'Adobe Inc.',
        description: 'PDF viewer and editor',
        isMsixAppAttach: false,
      },
    }),
    prisma.application.create({
      data: {
        name: 'teams',
        displayName: 'Microsoft Teams',
        version: '1.6.00.34865',
        category: 'Communication',
        publisher: 'Microsoft Corporation',
        description: 'Team collaboration and communication platform',
        isMsixAppAttach: true,
        licenseType: 'Per User',
        licenseRequired: true,
      },
    }),
    prisma.application.create({
      data: {
        name: 'zoom',
        displayName: 'Zoom Client',
        version: '5.17.1',
        category: 'Communication',
        publisher: 'Zoom Video Communications',
        description: 'Video conferencing application',
        isMsixAppAttach: false,
        licenseType: 'Per User',
        licenseRequired: true,
      },
    }),
    prisma.application.create({
      data: {
        name: 'slack',
        displayName: 'Slack Desktop',
        version: '4.35.126',
        category: 'Communication',
        publisher: 'Slack Technologies',
        description: 'Business messaging platform',
        isMsixAppAttach: true,
        licenseType: 'Per User',
        licenseRequired: true,
      },
    }),
    prisma.application.create({
      data: {
        name: 'vscode',
        displayName: 'Visual Studio Code',
        version: '1.85.1',
        category: 'Development',
        publisher: 'Microsoft Corporation',
        description: 'Lightweight code editor',
        isMsixAppAttach: false,
      },
    }),
    prisma.application.create({
      data: {
        name: '7zip',
        displayName: '7-Zip',
        version: '23.01',
        category: 'Utilities',
        publisher: 'Igor Pavlov',
        description: 'File archiver with high compression ratio',
        isMsixAppAttach: false,
      },
    }),
    prisma.application.create({
      data: {
        name: 'notepadpp',
        displayName: 'Notepad++',
        version: '8.6.1',
        category: 'Development',
        publisher: 'Notepad++ Team',
        description: 'Source code editor',
        isMsixAppAttach: false,
      },
    }),
    prisma.application.create({
      data: {
        name: 'sap-gui',
        displayName: 'SAP GUI',
        version: '8.00.109',
        category: 'Business',
        publisher: 'SAP SE',
        description: 'SAP graphical user interface client',
        isMsixAppAttach: false,
        licenseType: 'Per User',
        licenseRequired: true,
      },
    }),
    prisma.application.create({
      data: {
        name: 'powerbi',
        displayName: 'Power BI Desktop',
        version: '2.124.582',
        category: 'Business',
        publisher: 'Microsoft Corporation',
        description: 'Business analytics tool',
        isMsixAppAttach: true,
        licenseType: 'Per User',
        licenseRequired: true,
      },
    }),
  ]);
  console.log('Created', applications.length, 'applications');

  // Create templates
  const templates = await Promise.all([
    prisma.template.create({
      data: {
        name: 'Finance Standard Desktop',
        description: 'Standard desktop template for Finance department with productivity and business apps',
        status: 'DEPLOYED',
        environment: 'PRODUCTION',
        requestDate: new Date('2024-06-15'),
        approvedDate: new Date('2024-06-20'),
        deployedDate: new Date('2024-06-25'),
        businessUnitId: businessUnits[0].id,
        contactId: contacts[0].id,
        namingPrefix: 'vdpool-fin-prod',
        namingPattern: 'vdpool-{bu}-{env}-{region}',
        hostPoolType: 'POOLED',
        maxSessionLimit: 10,
        loadBalancerType: 'BREADTH_FIRST',
        regions: ['eastus', 'eastus2'],
        primaryRegion: 'eastus',
        goldenImageName: 'gi-finance-prod-v1.2.0',
        baseOS: 'Windows 11 Enterprise 23H2',
        imageVersion: '1.2.0',
        patchLevel: '2024-06',
        lastSysprepDate: new Date('2024-06-10'),
        computeGalleryId: '/subscriptions/xxx/resourceGroups/rg-avd-images/providers/Microsoft.Compute/galleries/gallery_prod/images/finance',
        subscriptionId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        resourceGroup: 'rg-avd-finance-prod-eus',
        hostPoolId: '/subscriptions/xxx/resourceGroups/rg-avd-finance-prod-eus/providers/Microsoft.DesktopVirtualization/hostPools/vdpool-fin-prod-eus',
        tags: { environment: 'production', costCenter: 'CC-1001', owner: 'john.smith@company.com', businessUnit: 'finance' },
        notes: 'Production template for Finance team. Includes SAP GUI and Power BI.',
        createdById: admin.id,
      },
    }),
    prisma.template.create({
      data: {
        name: 'HR Standard Desktop',
        description: 'Standard desktop template for HR department',
        status: 'APPROVED',
        environment: 'PRODUCTION',
        requestDate: new Date('2024-08-01'),
        approvedDate: new Date('2024-08-10'),
        businessUnitId: businessUnits[1].id,
        contactId: contacts[1].id,
        namingPrefix: 'vdpool-hr-prod',
        namingPattern: 'vdpool-{bu}-{env}-{region}',
        hostPoolType: 'POOLED',
        maxSessionLimit: 8,
        loadBalancerType: 'DEPTH_FIRST',
        regions: ['eastus'],
        primaryRegion: 'eastus',
        goldenImageName: 'gi-hr-prod-v1.0.0',
        baseOS: 'Windows 11 Enterprise 23H2',
        imageVersion: '1.0.0',
        patchLevel: '2024-07',
        lastSysprepDate: new Date('2024-07-25'),
        tags: { environment: 'production', costCenter: 'CC-1002', owner: 'sarah.jones@company.com', businessUnit: 'hr' },
        notes: 'Approved for production deployment. Scheduled for next maintenance window.',
        createdById: admin.id,
      },
    }),
    prisma.template.create({
      data: {
        name: 'IT Development Desktop',
        description: 'Development workstation template for IT team with dev tools',
        status: 'DEPLOYED',
        environment: 'DEVELOPMENT',
        requestDate: new Date('2024-05-01'),
        approvedDate: new Date('2024-05-05'),
        deployedDate: new Date('2024-05-08'),
        businessUnitId: businessUnits[2].id,
        contactId: contacts[2].id,
        namingPrefix: 'vdpool-it-dev',
        namingPattern: 'vdpool-{bu}-{env}-{region}',
        hostPoolType: 'PERSONAL',
        loadBalancerType: 'DEPTH_FIRST',
        regions: ['eastus', 'westus2'],
        primaryRegion: 'eastus',
        goldenImageName: 'gi-it-dev-v2.1.0',
        baseOS: 'Windows 11 Enterprise 23H2',
        imageVersion: '2.1.0',
        patchLevel: '2024-06',
        lastSysprepDate: new Date('2024-06-01'),
        subscriptionId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        resourceGroup: 'rg-avd-it-dev-eus',
        hostPoolId: '/subscriptions/xxx/resourceGroups/rg-avd-it-dev-eus/providers/Microsoft.DesktopVirtualization/hostPools/vdpool-it-dev-eus',
        tags: { environment: 'development', costCenter: 'CC-1003', owner: 'mike.wilson@company.com', businessUnit: 'it' },
        notes: 'Personal desktops for IT developers. Includes VS Code and various dev tools.',
        createdById: admin.id,
      },
    }),
    prisma.template.create({
      data: {
        name: 'Marketing Creative Desktop',
        description: 'Creative workstation for Marketing team',
        status: 'IN_REVIEW',
        environment: 'STAGING',
        requestDate: new Date('2024-09-01'),
        businessUnitId: businessUnits[3].id,
        contactId: contacts[3].id,
        namingPrefix: 'vdpool-mktg-stg',
        namingPattern: 'vdpool-{bu}-{env}-{region}',
        hostPoolType: 'POOLED',
        maxSessionLimit: 6,
        loadBalancerType: 'BREADTH_FIRST',
        regions: ['westus2'],
        primaryRegion: 'westus2',
        goldenImageName: 'gi-mktg-stg-v0.5.0',
        baseOS: 'Windows 11 Enterprise 23H2',
        imageVersion: '0.5.0',
        patchLevel: '2024-08',
        tags: { environment: 'staging', costCenter: 'CC-1004', owner: 'lisa.chen@company.com', businessUnit: 'marketing' },
        notes: 'In review - waiting for approval from security team.',
        createdById: admin.id,
      },
    }),
    prisma.template.create({
      data: {
        name: 'Vendor Contractor Desktop',
        description: 'Limited access desktop for external contractors',
        status: 'DRAFT',
        environment: 'PRODUCTION',
        requestDate: new Date('2024-09-15'),
        businessUnitId: businessUnits[4].id,
        contactId: contacts[4].id,
        namingPrefix: 'vdpool-vndr-prod',
        namingPattern: 'vdpool-{bu}-{env}-{region}',
        hostPoolType: 'POOLED',
        maxSessionLimit: 4,
        loadBalancerType: 'DEPTH_FIRST',
        regions: ['eastus'],
        primaryRegion: 'eastus',
        baseOS: 'Windows 11 Enterprise 23H2',
        tags: { environment: 'production', costCenter: 'CC-9001', owner: 'vendor.contact@acme.com', businessUnit: 'vendor', securityLevel: 'restricted' },
        notes: 'Draft template for vendor contractors. Requires security review before submission.',
        createdById: admin.id,
      },
    }),
    prisma.template.create({
      data: {
        name: 'Legacy Finance Desktop',
        description: 'Deprecated template - migrating to Finance Standard Desktop',
        status: 'DEPRECATED',
        environment: 'PRODUCTION',
        requestDate: new Date('2023-01-15'),
        approvedDate: new Date('2023-01-20'),
        deployedDate: new Date('2023-01-25'),
        businessUnitId: businessUnits[0].id,
        contactId: contacts[0].id,
        namingPrefix: 'vdpool-fin-legacy',
        namingPattern: 'vdpool-{bu}-{env}-{region}',
        hostPoolType: 'POOLED',
        maxSessionLimit: 8,
        loadBalancerType: 'BREADTH_FIRST',
        regions: ['eastus'],
        primaryRegion: 'eastus',
        goldenImageName: 'gi-finance-legacy-v0.9.0',
        baseOS: 'Windows 10 Enterprise 21H2',
        imageVersion: '0.9.0',
        patchLevel: '2023-12',
        tags: { environment: 'production', costCenter: 'CC-1001', businessUnit: 'finance', status: 'deprecated' },
        notes: 'Deprecated as of 2024-06. Users migrated to new Finance Standard Desktop template.',
        createdById: admin.id,
      },
    }),
  ]);
  console.log('Created', templates.length, 'templates');

  // Assign applications to templates
  // Finance Standard Desktop apps
  await prisma.templateApplication.createMany({
    data: [
      { templateId: templates[0].id, applicationId: applications[0].id, installOrder: 1 }, // Office 365
      { templateId: templates[0].id, applicationId: applications[2].id, installOrder: 2 }, // Edge
      { templateId: templates[0].id, applicationId: applications[3].id, installOrder: 3 }, // Adobe Reader
      { templateId: templates[0].id, applicationId: applications[4].id, installOrder: 4 }, // Teams
      { templateId: templates[0].id, applicationId: applications[8].id, installOrder: 5 }, // 7-Zip
      { templateId: templates[0].id, applicationId: applications[10].id, installOrder: 6 }, // SAP GUI
      { templateId: templates[0].id, applicationId: applications[11].id, installOrder: 7 }, // Power BI
    ],
    skipDuplicates: true,
  });

  // HR Standard Desktop apps
  await prisma.templateApplication.createMany({
    data: [
      { templateId: templates[1].id, applicationId: applications[0].id, installOrder: 1 }, // Office 365
      { templateId: templates[1].id, applicationId: applications[2].id, installOrder: 2 }, // Edge
      { templateId: templates[1].id, applicationId: applications[3].id, installOrder: 3 }, // Adobe Reader
      { templateId: templates[1].id, applicationId: applications[4].id, installOrder: 4 }, // Teams
      { templateId: templates[1].id, applicationId: applications[5].id, installOrder: 5 }, // Zoom
    ],
    skipDuplicates: true,
  });

  // IT Development Desktop apps
  await prisma.templateApplication.createMany({
    data: [
      { templateId: templates[2].id, applicationId: applications[0].id, installOrder: 1 }, // Office 365
      { templateId: templates[2].id, applicationId: applications[1].id, installOrder: 2 }, // Chrome
      { templateId: templates[2].id, applicationId: applications[2].id, installOrder: 3 }, // Edge
      { templateId: templates[2].id, applicationId: applications[4].id, installOrder: 4 }, // Teams
      { templateId: templates[2].id, applicationId: applications[6].id, installOrder: 5 }, // Slack
      { templateId: templates[2].id, applicationId: applications[7].id, installOrder: 6 }, // VS Code
      { templateId: templates[2].id, applicationId: applications[8].id, installOrder: 7 }, // 7-Zip
      { templateId: templates[2].id, applicationId: applications[9].id, installOrder: 8 }, // Notepad++
    ],
    skipDuplicates: true,
  });

  // Marketing Creative Desktop apps
  await prisma.templateApplication.createMany({
    data: [
      { templateId: templates[3].id, applicationId: applications[0].id, installOrder: 1 }, // Office 365
      { templateId: templates[3].id, applicationId: applications[1].id, installOrder: 2 }, // Chrome
      { templateId: templates[3].id, applicationId: applications[3].id, installOrder: 3 }, // Adobe Reader
      { templateId: templates[3].id, applicationId: applications[4].id, installOrder: 4 }, // Teams
      { templateId: templates[3].id, applicationId: applications[6].id, installOrder: 5 }, // Slack
    ],
    skipDuplicates: true,
  });

  // Vendor Contractor Desktop apps
  await prisma.templateApplication.createMany({
    data: [
      { templateId: templates[4].id, applicationId: applications[2].id, installOrder: 1 }, // Edge
      { templateId: templates[4].id, applicationId: applications[3].id, installOrder: 2 }, // Adobe Reader
      { templateId: templates[4].id, applicationId: applications[4].id, installOrder: 3 }, // Teams
    ],
    skipDuplicates: true,
  });

  console.log('Assigned applications to templates');

  // Create some audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        adminId: admin.id,
        action: 'CREATE',
        entityType: 'TEMPLATE',
        entityId: templates[0].id,
        details: { name: templates[0].name },
      },
      {
        adminId: admin.id,
        action: 'STATUS_CHANGE',
        entityType: 'TEMPLATE',
        entityId: templates[0].id,
        details: { from: 'DRAFT', to: 'IN_REVIEW' },
      },
      {
        adminId: admin.id,
        action: 'STATUS_CHANGE',
        entityType: 'TEMPLATE',
        entityId: templates[0].id,
        details: { from: 'IN_REVIEW', to: 'APPROVED' },
      },
      {
        adminId: admin.id,
        action: 'STATUS_CHANGE',
        entityType: 'TEMPLATE',
        entityId: templates[0].id,
        details: { from: 'APPROVED', to: 'DEPLOYED' },
      },
      {
        adminId: admin.id,
        action: 'CREATE',
        entityType: 'APPLICATION',
        entityId: applications[0].id,
        details: { name: applications[0].name },
      },
      {
        adminId: admin.id,
        action: 'CREATE',
        entityType: 'BUSINESS_UNIT',
        entityId: businessUnits[0].id,
        details: { name: businessUnits[0].name, code: businessUnits[0].code },
      },
    ],
  });
  console.log('Created audit log entries');

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Initializing production database...');

  // Create admin user (required for initial login)
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@avdmanager.local' },
    update: {},
    create: {
      email: 'admin@avdmanager.local',
      passwordHash: hashedPassword,
      name: 'System Administrator',
    },
  });
  console.log('Created admin user:', admin.email);

  // Log initial setup
  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      action: 'SYSTEM_INIT',
      entityType: 'SYSTEM',
      entityId: 'system',
      details: { message: 'Production database initialized' },
    },
  });
  console.log('Created initial audit log entry');

  console.log('\n========================================');
  console.log('Production database initialized!');
  console.log('========================================');
  console.log('\nDefault Admin Credentials:');
  console.log('  Email:    admin@avdmanager.local');
  console.log('  Password: admin123');
  console.log('\n** IMPORTANT: Change the admin password after first login! **\n');
}

main()
  .catch((e) => {
    console.error('Error initializing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

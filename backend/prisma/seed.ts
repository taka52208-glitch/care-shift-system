import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'デモ介護施設',
      subdomain: 'demo',
      subscriptionStatus: 'ACTIVE',
    },
  });

  console.log(`✅ Created tenant: ${tenant.name} (${tenant.subdomain})`);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@example.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      name: '管理者',
      role: 'ADMIN',
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  // Create shift patterns
  const patternsData = [
    { name: '早番', code: 'E', startTime: '07:00', endTime: '16:00', breakTime: 60, color: '#fbbf24' },
    { name: '日勤', code: 'D', startTime: '09:00', endTime: '18:00', breakTime: 60, color: '#22c55e' },
    { name: '遅番', code: 'L', startTime: '12:00', endTime: '21:00', breakTime: 60, color: '#3b82f6' },
    { name: '夜勤', code: 'N', startTime: '21:00', endTime: '07:00', breakTime: 120, color: '#8b5cf6' },
    { name: '公休', code: 'O', startTime: '-', endTime: '-', breakTime: 0, color: '#94a3b8' },
  ];

  for (const pattern of patternsData) {
    await prisma.shiftPattern.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: pattern.code } },
      update: {},
      create: { ...pattern, tenantId: tenant.id },
    });
  }

  console.log(`✅ Created ${patternsData.length} shift patterns`);

  // Create sample staff
  const staffData = [
    { name: '山田太郎', qualification: '介護福祉士', employmentType: '正社員', phone: '090-1234-5678' },
    { name: '佐藤花子', qualification: 'ヘルパー2級', employmentType: 'パート', phone: '090-2345-6789' },
    { name: '鈴木一郎', qualification: '介護福祉士', employmentType: '正社員', phone: '090-3456-7890' },
    { name: '田中美咲', qualification: 'ヘルパー2級', employmentType: 'パート', phone: '090-4567-8901' },
    { name: '高橋健二', qualification: '介護福祉士', employmentType: '正社員', phone: '090-5678-9012' },
  ];

  for (const staff of staffData) {
    await prisma.staff.upsert({
      where: { id: `${tenant.id}-${staff.name}` }, // Use composite key
      update: {},
      create: { ...staff, tenantId: tenant.id },
    });
  }

  console.log(`✅ Created ${staffData.length} staff members`);

  // Create constraints
  const constraintsData = [
    { category: 'staffing', key: 'minDayStaff', value: '3' },
    { category: 'staffing', key: 'minNightStaff', value: '2' },
    { category: 'staffing', key: 'minQualifiedDay', value: '1' },
    { category: 'workLimit', key: 'maxConsecutiveDays', value: '5' },
    { category: 'workLimit', key: 'maxNightShifts', value: '8' },
    { category: 'workLimit', key: 'restAfterNight', value: '1' },
    { category: 'holiday', key: 'weeklyHolidays', value: '2' },
    { category: 'holiday', key: 'minMonthlyHolidays', value: '8' },
  ];

  for (const constraint of constraintsData) {
    await prisma.constraint.upsert({
      where: {
        tenantId_category_key: {
          tenantId: tenant.id,
          category: constraint.category,
          key: constraint.key,
        },
      },
      update: { value: constraint.value },
      create: { ...constraint, tenantId: tenant.id },
    });
  }

  console.log(`✅ Created ${constraintsData.length} constraints`);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

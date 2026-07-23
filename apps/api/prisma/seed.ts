import { PrismaClient, CampaignStatus, PaymentMode, DonationCategory, ExpenseCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Demo Organization
  const org = await prisma.organization.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      name: 'Shree Ganesh Mandal, Pune',
      nameMarathi: 'श्री गणेश मंडळ, पुणे',
      nameHindi: 'श्री गणेश मंडल, पुणे',
      slug: 'shree-ganesh-mandal-pune',
      address: '123, Tilak Road, Sadashiv Peth',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411030',
      phone: '9876543210',
      email: 'ganesh.mandal@example.com',
      subscriptionPlan: 'STANDARD',
      subscriptionExpiry: new Date('2027-12-31'),
    },
  });

  // Create Areas
  const [wardA, wardB, marketArea, residentialArea] = await Promise.all([
    prisma.collectorArea.upsert({
      where: { id: 'area-ward-a' },
      update: {},
      create: { id: 'area-ward-a', orgId: org.id, name: 'Ward A', description: 'Tilak Road & Surroundings' },
    }),
    prisma.collectorArea.upsert({
      where: { id: 'area-ward-b' },
      update: {},
      create: { id: 'area-ward-b', orgId: org.id, name: 'Ward B', description: 'MG Road Area' },
    }),
    prisma.collectorArea.upsert({
      where: { id: 'area-market' },
      update: {},
      create: { id: 'area-market', orgId: org.id, name: 'Market Area', description: 'Local Market & Shops' },
    }),
    prisma.collectorArea.upsert({
      where: { id: 'area-res' },
      update: {},
      create: { id: 'area-res', orgId: org.id, name: 'Residential Zone', description: 'Peth Area' },
    }),
  ]);

  // Create Admin User
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { orgId_phone: { orgId: org.id, phone: '9876543210' } },
    update: {},
    create: {
      orgId: org.id,
      name: 'Rajesh Patil',
      phone: '9876543210',
      email: 'admin@mandal.com',
      passwordHash: adminHash,
      role: 'ORG_ADMIN',
    },
  });

  // Create Collectors
  const collectorHash = await bcrypt.hash('Collector@123', 12);
  const [collector1, collector2, collector3] = await Promise.all([
    prisma.user.upsert({
      where: { orgId_phone: { orgId: org.id, phone: '9123456001' } },
      update: {},
      create: {
        orgId: org.id, name: 'Amit Sharma', phone: '9123456001',
        passwordHash: collectorHash, role: 'COLLECTOR', areaId: wardA.id,
      },
    }),
    prisma.user.upsert({
      where: { orgId_phone: { orgId: org.id, phone: '9123456002' } },
      update: {},
      create: {
        orgId: org.id, name: 'Rahul Desai', phone: '9123456002',
        passwordHash: collectorHash, role: 'COLLECTOR', areaId: wardB.id,
      },
    }),
    prisma.user.upsert({
      where: { orgId_phone: { orgId: org.id, phone: '9123456003' } },
      update: {},
      create: {
        orgId: org.id, name: 'Sunil Joshi', phone: '9123456003',
        passwordHash: collectorHash, role: 'COLLECTOR', areaId: marketArea.id,
      },
    }),
  ]);

  // Create Treasurer
  const treasurer = await prisma.user.upsert({
    where: { orgId_phone: { orgId: org.id, phone: '9123456004' } },
    update: {},
    create: {
      orgId: org.id, name: 'Anita Kulkarni', phone: '9123456004',
      passwordHash: adminHash, role: 'TREASURER',
    },
  });

  // Create Campaign
  const campaign = await prisma.campaign.upsert({
    where: { orgId_receiptPrefix: { orgId: org.id, receiptPrefix: 'SGM-2027' } },
    update: {},
    create: {
      orgId: org.id,
      name: 'Ganesh Utsav 2027',
      nameMarathi: 'गणेश उत्सव 2027',
      nameHindi: 'गणेश उत्सव 2027',
      year: 2027,
      startDate: new Date('2027-08-22'),
      endDate: new Date('2027-09-01'),
      targetAmount: 500000,
      receiptPrefix: 'SGM-2027',
      receiptSeq: 0,
      status: 'ACTIVE',
      description: 'Annual Ganesh Festival 2027 - 10 days celebration',
    },
  });

  // Create Sample Receipts
  const donors = [
    { name: 'Suresh Ramchandra Patil', phone: '9988776655', address: 'Flat 12, Ganesh Nagar', amount: 5000, category: 'GENERAL', collector: collector1, area: wardA },
    { name: 'Meena Vijay Kulkarni', phone: '9876543211', address: '45, Prabhat Road', amount: 2100, category: 'DECORATION', collector: collector1, area: wardA },
    { name: 'Kiran Anil More', phone: '9765432100', address: 'Shop 3, Market Lane', amount: 1100, category: 'FOOD', collector: collector3, area: marketArea },
    { name: 'Priya Ashok Sharma', phone: '9654321098', address: '78, Shivaji Nagar', amount: 500, category: 'GENERAL', collector: collector2, area: wardB },
    { name: 'Ganesh Hardware Store', phone: '9543210987', address: '12, Market Road', amount: 11000, category: 'DECORATION', collector: collector3, area: marketArea },
    { name: 'Ramesh Bhaskar Joshi', phone: '9432109876', address: 'Near Lakshmi Temple', amount: 2500, category: 'PRASAD', collector: collector2, area: wardB },
    { name: 'Lakshmi Govind Deshpande', phone: null, address: 'Sadashiv Peth', amount: 3000, category: 'GENERAL', collector: collector1, area: wardA },
    { name: 'Shri Ram Traders', phone: '9321098765', address: 'Main Bazaar', amount: 21000, category: 'SOUND', collector: collector3, area: marketArea },
    { name: 'Anand Prakash Nair', phone: '9210987654', address: 'Koregaon Park', amount: 1000, category: 'GENERAL', collector: collector2, area: wardB },
    { name: 'Sanjay Vinod Pawar', phone: '9109876543', address: 'Deccan', amount: 5000, category: 'FIREWORKS', collector: collector1, area: wardA },
  ];

  for (let i = 0; i < donors.length; i++) {
    const d = donors[i];
    const seq = i + 1;
    const receiptNumber = `SGM-2027-${String(seq).padStart(4, '0')}`;

    await prisma.receipt.upsert({
      where: { receiptNumber },
      update: {},
      create: {
        campaignId: campaign.id,
        collectorId: d.collector.id,
        areaId: d.area.id,
        receiptNumber,
        donorName: d.name,
        donorPhone: d.phone,
        donorAddress: d.address,
        amount: d.amount,
        amountInWords: `${d.amount} Rupees Only`,
        category: d.category as DonationCategory,
        paymentMode: d.amount >= 5000 ? 'UPI' : 'CASH',
        createdAt: new Date(Date.now() - (donors.length - i) * 2 * 60 * 60 * 1000),
      },
    });
  }

  // Update campaign receipt seq
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { receiptSeq: donors.length },
  });

  // Create Expenses
  await prisma.expense.createMany({
    skipDuplicates: true,
    data: [
      { campaignId: campaign.id, addedById: treasurer.id, approvedById: admin.id, category: 'DECORATION', amount: 85000, description: 'Flower decoration and lighting', isApproved: true, approvedAt: new Date() },
      { campaignId: campaign.id, addedById: treasurer.id, approvedById: admin.id, category: 'SOUND_SYSTEM', amount: 45000, description: 'Sound system rental for 10 days', isApproved: true, approvedAt: new Date() },
      { campaignId: campaign.id, addedById: treasurer.id, category: 'FOOD', amount: 30000, description: 'Prasad distribution expenses', isApproved: false },
      { campaignId: campaign.id, addedById: treasurer.id, approvedById: admin.id, category: 'PRINTING', amount: 5000, description: 'Banner and pamphlet printing', isApproved: true, approvedAt: new Date() },
    ],
  });

  console.log('✅ Seed complete!');
  console.log(`\n📋 Demo Credentials:`);
  console.log(`   Admin:     Phone: 9876543210  Password: Admin@123`);
  console.log(`   Collector: Phone: 9123456001  Password: Collector@123`);
  console.log(`   Treasurer: Phone: 9123456004  Password: Admin@123`);
  console.log(`\n🏢 Organization: Shree Ganesh Mandal, Pune`);
  console.log(`📣 Active Campaign: Ganesh Utsav 2027`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

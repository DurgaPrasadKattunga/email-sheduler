import { PrismaClient, EmailStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing test data
  await prisma.email.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.sender.deleteMany();
  await prisma.slackConnection.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Test User
  const user = await prisma.user.create({
    data: {
      googleId: 'google-dev-user-001',
      name: 'Alex Morgan',
      email: 'alex.morgan@example.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    },
  });
  console.log(`✅ Created User: ${user.name} (${user.email})`);

  // 2. Create Ethereal Sender for User
  const sender = await prisma.sender.create({
    data: {
      userId: user.id,
      email: 'outreach@ethereal.email',
      etherealUsername: 'dev_sender_ethereal',
      etherealPasswordEncrypted: 'mock_encrypted_secret_pass',
    },
  });
  console.log(`✅ Created Sender: ${sender.email}`);

  // 3. Create a Campaign
  const campaign = await prisma.campaign.create({
    data: {
      userId: user.id,
      subject: 'Welcome to AutoMail: Next-Gen Scheduling Platform',
      body: 'Hi {{name}},\n\nWe are thrilled to welcome you to our modern distributed email scheduling platform.\n\nBest regards,\nThe AutoMail Team',
      startTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      delayMs: 2000,
      hourlyLimit: 100,
    },
  });
  console.log(`✅ Created Campaign: "${campaign.subject}"`);

  // 4. Create Sample Scheduled, Sent, and Rate Limited Emails
  const now = new Date();

  const emails = await prisma.email.createMany({
    data: [
      {
        campaignId: campaign.id,
        senderId: sender.id,
        recipient: 'sarah.connor@cyberdyne.io',
        subject: campaign.subject,
        body: campaign.body.replace('{{name}}', 'Sarah'),
        scheduledAt: new Date(now.getTime() - 3600 * 1000),
        status: EmailStatus.sent,
        jobId: `job_seed_001_${Date.now()}`,
        attempts: 1,
        sentAt: new Date(now.getTime() - 3550 * 1000),
      },
      {
        campaignId: campaign.id,
        senderId: sender.id,
        recipient: 'john.wick@continental.org',
        subject: campaign.subject,
        body: campaign.body.replace('{{name}}', 'John'),
        scheduledAt: new Date(now.getTime() - 1800 * 1000),
        status: EmailStatus.sent,
        jobId: `job_seed_002_${Date.now()}`,
        attempts: 1,
        sentAt: new Date(now.getTime() - 1795 * 1000),
      },
      {
        campaignId: campaign.id,
        senderId: sender.id,
        recipient: 'bruce.wayne@waynecorp.com',
        subject: campaign.subject,
        body: campaign.body.replace('{{name}}', 'Bruce'),
        scheduledAt: new Date(now.getTime() + 600 * 1000),
        status: EmailStatus.scheduled,
        jobId: `job_seed_003_${Date.now()}`,
        attempts: 0,
      },
      {
        campaignId: campaign.id,
        senderId: sender.id,
        recipient: 'tony.stark@starkindustries.com',
        subject: campaign.subject,
        body: campaign.body.replace('{{name}}', 'Tony'),
        scheduledAt: new Date(now.getTime() + 1200 * 1000),
        status: EmailStatus.scheduled,
        jobId: `job_seed_004_${Date.now()}`,
        attempts: 0,
      },
      {
        campaignId: campaign.id,
        senderId: sender.id,
        recipient: 'clark.kent@dailyplanet.news',
        subject: campaign.subject,
        body: campaign.body.replace('{{name}}', 'Clark'),
        scheduledAt: new Date(now.getTime() + 1800 * 1000),
        status: EmailStatus.rate_limited,
        jobId: `job_seed_005_${Date.now()}`,
        attempts: 1,
        errorMessage: 'Hourly limit reached. Rescheduled to next hour window.',
      },
    ],
  });

  console.log(`✅ Created ${emails.count} sample email records.`);
  console.log('🎉 Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

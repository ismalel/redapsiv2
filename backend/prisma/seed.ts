import { PrismaClient, Role, TherapyStatus, TherapyOrigin, SessionStatus, BillingType, PaymentScope, PaymentStatus, OnboardingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin1234!', 10);
  const psychHash = await bcrypt.hash('Psych1234!', 10);
  const consultHash = await bcrypt.hash('Consult1234!', 10);

  // 1. Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@redapsi.app' },
    update: {},
    create: {
      email: 'admin@redapsi.app',
      name: 'Administradora REDAPSI',
      password_hash: passwordHash,
      role: Role.ADMIN,
    },
  });

  const adminPsy = await prisma.user.upsert({
    where: { email: 'adminpsy@redapsi.app' },
    update: {},
    create: {
      email: 'adminpsy@redapsi.app',
      name: 'Admin Psicóloga',
      password_hash: passwordHash,
      role: Role.ADMIN_PSYCHOLOGIST,
    },
  });

  const psy1 = await prisma.user.upsert({
    where: { email: 'psy1@redapsi.app' },
    update: {},
    create: {
      email: 'psy1@redapsi.app',
      name: 'Psicóloga Uno',
      password_hash: psychHash,
      role: Role.PSYCHOLOGIST,
      psychologist_profile: {
        create: {
          license_number: 'PSY-001',
          specializations: ['Ansiedad', 'Terapia Feminista'],
          bio: 'Experta en psicología feminista con perspectiva de género.',
          session_fee: 500.00,
          modalities: ['virtual', 'in_person'],
          languages: ['es', 'en'],
        }
      }
    },
  });

  const psy2 = await prisma.user.upsert({
    where: { email: 'psy2@redapsi.app' },
    update: {},
    create: {
      email: 'psy2@redapsi.app',
      name: 'Psicóloga Dos',
      password_hash: psychHash,
      role: Role.PSYCHOLOGIST,
      psychologist_profile: {
        create: {
          license_number: 'PSY-002',
          specializations: ['Trauma', 'LGBTQ+'],
          bio: 'Dedicada al cuidado informado en trauma.',
          session_fee: 600.00,
          modalities: ['virtual'],
          languages: ['es'],
        }
      }
    },
  });

  const consultant1 = await prisma.user.upsert({
    where: { email: 'consultant1@redapsi.app' },
    update: {},
    create: {
      email: 'consultant1@redapsi.app',
      name: 'Consultante Uno',
      password_hash: consultHash,
      role: Role.CONSULTANT,
      consultant_profile: {
        create: {
          onboarding_status: OnboardingStatus.COMPLETED,
          onboarding_step: 6,
          phone: '+525512345678',
        }
      }
    },
  });

  const consultant2 = await prisma.user.upsert({
    where: { email: 'consultant2@redapsi.app' },
    update: {},
    create: {
      email: 'consultant2@redapsi.app',
      name: 'Consultante Dos',
      password_hash: consultHash,
      role: Role.CONSULTANT,
      consultant_profile: {
        create: {
          onboarding_status: OnboardingStatus.INCOMPLETE,
          onboarding_step: 3,
          onboarding_data: { step1: "completado", step2: "completado" }
        }
      }
    },
  });

  const consultant3 = await prisma.user.upsert({
    where: { email: 'consultant3@redapsi.app' },
    update: {},
    create: {
      email: 'consultant3@redapsi.app',
      name: 'Consultante Tres',
      password_hash: consultHash,
      role: Role.CONSULTANT,
      consultant_profile: {
        create: {
          onboarding_status: OnboardingStatus.COMPLETED,
          onboarding_step: 6,
        }
      }
    },
  });

  // 2. Therapy
  const therapy1 = await prisma.therapy.create({
    data: {
      psychologist_id: psy1.id,
      consultant_id: consultant1.id,
      origin: TherapyOrigin.PSYCHOLOGIST_INITIATED,
      modality: 'virtual',
      status: TherapyStatus.ACTIVE,
      billing_plan: {
        create: {
          billing_type: BillingType.PER_SESSION,
          default_fee: 500.00,
        }
      }
    }
  });

  // 3. Sessions
  await prisma.therapySession.create({
    data: {
      therapy_id: therapy1.id,
      scheduled_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      status: SessionStatus.COMPLETED,
      session_fee: 500.00,
    }
  });

  await prisma.therapySession.create({
    data: {
      therapy_id: therapy1.id,
      scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      status: SessionStatus.SCHEDULED,
      session_fee: 500.00,
    }
  });

  await prisma.therapySession.create({
    data: {
      therapy_id: therapy1.id,
      scheduled_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday
      status: SessionStatus.CANCELLED,
      session_fee: 500.00,
      cancelled_by: psy1.id,
      cancel_reason: 'Emergencia de la psicóloga',
    }
  });

  // 4. Events
  await prisma.event.create({
    data: {
      title: 'Taller de Psicología Feminista',
      description: 'Un taller gratuito sobre los fundamentos de la psicología feminista.',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // in 10 days
      cost: 0,
      location: 'En línea',
    }
  });

  await prisma.event.create({
    data: {
      title: 'Seminario de Cuidado Informado en Trauma',
      description: 'Un seminario pagado sobre técnicas de cuidado para sobrevivientes de trauma.',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      cost: 200.00,
      location: 'Centro Comunitario',
    }
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

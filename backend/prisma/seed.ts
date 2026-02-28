import { PrismaClient, Role, TherapyStatus, TherapyOrigin, SessionStatus, BillingType, PaymentScope, PaymentStatus, OnboardingStatus, GoalStatus, PaymentMethod, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin1234!', 12);
  const psychHash = await bcrypt.hash('Psych1234!', 12);
  const consultHash = await bcrypt.hash('Consult1234!', 12);

  // 1. Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@redapsi.app' },
    update: { password_hash: passwordHash },
    create: {
      email: 'admin@redapsi.app',
      name: 'Administradora REDAPSI',
      password_hash: passwordHash,
      role: Role.ADMIN,
    },
  });

  const adminPsy = await prisma.user.upsert({
    where: { email: 'adminpsy@redapsi.app' },
    update: { password_hash: passwordHash },
    create: {
      email: 'adminpsy@redapsi.app',
      name: 'Admin Psicóloga',
      password_hash: passwordHash,
      role: Role.ADMIN_PSYCHOLOGIST,
    },
  });

  const adminPsyProfile = await prisma.psychologistProfile.upsert({
    where: { user_id: adminPsy.id },
    update: {},
    create: {
      user_id: adminPsy.id,
      license_number: 'ADM-PSY-001',
      specializations: ['Administración', 'Terapia de Pareja'],
      bio: 'Administradora y psicóloga con amplia experiencia.',
      session_fee: 800.00,
      modalities: ['virtual', 'in_person'],
      languages: ['es'],
    }
  });

  const psy1User = await prisma.user.upsert({
    where: { email: 'psy1@redapsi.app' },
    update: { password_hash: psychHash },
    create: {
      email: 'psy1@redapsi.app',
      name: 'Psicóloga Uno',
      password_hash: psychHash,
      role: Role.PSYCHOLOGIST,
    },
  });

  const psy1Profile = await prisma.psychologistProfile.upsert({
    where: { user_id: psy1User.id },
    update: {},
    create: {
      user_id: psy1User.id,
      license_number: 'PSY-001',
      specializations: ['Ansiedad', 'Terapia Feminista'],
      bio: 'Experta en psicología feminista con perspectiva de género.',
      session_fee: 500.00,
      modalities: ['virtual', 'in_person'],
      languages: ['es', 'en'],
    }
  });

  const psy2User = await prisma.user.upsert({
    where: { email: 'psy2@redapsi.app' },
    update: { 
      password_hash: psychHash,
      must_change_password: true
    },
    create: {
      email: 'psy2@redapsi.app',
      name: 'Psicóloga Dos',
      password_hash: psychHash,
      role: Role.PSYCHOLOGIST,
      must_change_password: true,
    },
  });

  const psy2Profile = await prisma.psychologistProfile.upsert({
    where: { user_id: psy2User.id },
    update: {},
    create: {
      user_id: psy2User.id,
      license_number: 'PSY-002',
      specializations: ['Trauma', 'LGBTQ+'],
      bio: 'Dedicada al cuidado informado en trauma.',
      session_fee: 600.00,
      modalities: ['virtual'],
      languages: ['es'],
    }
  });

  // Availability
  const profiles = [psy1Profile, psy2Profile];
  for (const profile of profiles) {
    for (let day = 1; day <= 5; day++) {
      await prisma.availabilitySlot.create({
        data: { 
          psychologist_profile_id: profile.id, 
          day_of_week: day, 
          start_time: '09:00', 
          end_time: '18:00' 
        }
      });
    }
  }

  const consultant1User = await prisma.user.upsert({
    where: { email: 'consultant1@redapsi.app' },
    update: { password_hash: consultHash },
    create: {
      email: 'consultant1@redapsi.app',
      name: 'Consultante Uno',
      password_hash: consultHash,
      role: Role.CONSULTANT,
    },
  });

  await prisma.consultantProfile.upsert({
    where: { user_id: consultant1User.id },
    update: {},
    create: {
      user_id: consultant1User.id,
      onboarding_status: OnboardingStatus.COMPLETED,
      onboarding_step: 6,
      phone: '+525512345678',
    }
  });

  const consultant2User = await prisma.user.upsert({
    where: { email: 'consultant2@redapsi.app' },
    update: { password_hash: consultHash },
    create: {
      email: 'consultant2@redapsi.app',
      name: 'Consultante Dos',
      password_hash: consultHash,
      role: Role.CONSULTANT,
    },
  });

  await prisma.consultantProfile.upsert({
    where: { user_id: consultant2User.id },
    update: {},
    create: {
      user_id: consultant2User.id,
      onboarding_status: OnboardingStatus.INCOMPLETE,
      onboarding_step: 3,
      onboarding_data: { step1: "completado" }
    }
  });

  const consultant3User = await prisma.user.upsert({
    where: { email: 'consultant3@redapsi.app' },
    update: { password_hash: consultHash },
    create: {
      email: 'consultant3@redapsi.app',
      name: 'Consultante Tres',
      password_hash: consultHash,
      role: Role.CONSULTANT,
    },
  });

  await prisma.consultantProfile.upsert({
    where: { user_id: consultant3User.id },
    update: {},
    create: {
      user_id: consultant3User.id,
      onboarding_status: OnboardingStatus.COMPLETED,
      onboarding_step: 6,
    }
  });

  // 2. Therapy
  const therapy1 = await prisma.therapy.create({
    data: {
      psychologist_id: psy1User.id,
      consultant_id: consultant1User.id,
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

  // 3. Therapy Request
  await prisma.therapyRequest.upsert({
    where: { id: 'seed-request-1' },
    update: {},
    create: {
      id: 'seed-request-1',
      psychologist_id: psy2User.id,
      consultant_id: consultant3User.id,
      message: 'Me gustaría iniciar terapia.',
      status: 'PENDING'
    }
  });

  // 4. Sessions
  const completedSession = await prisma.therapySession.create({
    data: {
      therapy_id: therapy1.id,
      scheduled_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: SessionStatus.COMPLETED,
      session_fee: 500.00,
    }
  });

  await prisma.therapySession.create({
    data: {
      therapy_id: therapy1.id,
      scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: SessionStatus.SCHEDULED,
      session_fee: 500.00,
    }
  });

  await prisma.therapySession.create({
    data: {
      therapy_id: therapy1.id,
      scheduled_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: SessionStatus.CANCELLED,
      session_fee: 500.00,
      cancelled_by: psy1User.id,
      cancelled_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      cancel_reason: 'Emergencia',
    }
  });

  // 5. Notes
  await prisma.sessionNote.create({
    data: {
      session_id: completedSession.id,
      author_id: psy1User.id,
      content: 'Nota pública.',
      is_private: false
    }
  });

  await prisma.sessionNote.create({
    data: {
      session_id: completedSession.id,
      author_id: psy1User.id,
      content: 'Nota privada.',
      is_private: true
    }
  });

  // 6. Payment
  await prisma.payment.create({
    data: {
      session_id: completedSession.id,
      registered_by: psy1User.id,
      amount: 500.00,
      method: 'CASH',
      status: 'PAID',
      scope: 'THERAPY_SESSION',
      paid_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    }
  });

  // 7. Goals
  const goal1 = await prisma.goal.create({
    data: {
      therapy_id: therapy1.id,
      title: 'Meta 1',
      status: 'IN_PROGRESS',
      progress: 40
    }
  });

  await prisma.goalProgressEntry.create({
    data: {
      goal_id: goal1.id,
      progress: 20,
      notes: 'Inicio'
    }
  });

  // 8. Notifications
  await prisma.notification.create({
    data: {
      user_id: consultant1User.id,
      type: NotificationType.SESSION_SCHEDULED,
      title: 'Sesión Programada',
      body: 'Tu sesión ha sido confirmada.',
    }
  });

  // 9. Events
  await prisma.event.create({
    data: {
      title: 'Evento 1',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      cost: 0,
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

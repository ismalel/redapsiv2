import { PrismaClient, Role, TherapyStatus, TherapyOrigin, SessionStatus, BillingType, PaymentScope, PaymentStatus, OnboardingStatus, GoalStatus, PaymentMethod, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Use 12 rounds for bcrypt per spec
  // Pre-generating hashes to ensure consistency across re-seeds
  const passwordHash = await bcrypt.hash('Admin1234!', 12);
  const psychHash = await bcrypt.hash('Psych1234!', 12);
  const consultHash = await bcrypt.hash('Consult1234!', 12);

  // 1. Users (Idempotent upsert)
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

  // Psychologist Availability (Mon-Fri 9-18h)
  const profiles = [psy1Profile, psy2Profile];
  for (const profile of profiles) {
    for (let day = 1; day <= 5; day++) {
      // Find if slot exists to ensure idempotency
      const existingSlot = await prisma.availabilitySlot.findFirst({
        where: { psychologist_profile_id: profile.id, day_of_week: day }
      });
      if (!existingSlot) {
        await prisma.availabilitySlot.create({
          data: { psychologist_profile_id: profile.id, day_of_week: day, start_time: '09:00', end_time: '18:00' }
        });
      }
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
      onboarding_data: { step1: "completado", step2: "completado" }
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

  // 2. Therapy (Idempotent find or create)
  let therapy1 = await prisma.therapy.findFirst({
    where: { psychologist_id: psy1User.id, consultant_id: consultant1User.id }
  });

  if (!therapy1) {
    therapy1 = await prisma.therapy.create({
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
  }

  // 3. Therapy Request
  await prisma.therapyRequest.upsert({
    where: { id: 'seed-request-1' }, 
    update: {},
    create: {
      id: 'seed-request-1',
      psychologist_id: psy2User.id,
      consultant_id: consultant3User.id,
      message: 'Me gustaría iniciar terapia feminista.',
      status: 'PENDING'
    }
  });

  // 4. Sessions
  const completedSession = await prisma.therapySession.upsert({
    where: { id: 'seed-session-1' },
    update: {},
    create: {
      id: 'seed-session-1',
      therapy_id: therapy1.id,
      scheduled_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: SessionStatus.COMPLETED,
      session_fee: 500.00,
    }
  });

  await prisma.therapySession.upsert({
    where: { id: 'seed-session-2' },
    update: {},
    create: {
      id: 'seed-session-2',
      therapy_id: therapy1.id,
      scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: SessionStatus.SCHEDULED,
      session_fee: 500.00,
    }
  });

  await prisma.therapySession.upsert({
    where: { id: 'seed-session-3' },
    update: {},
    create: {
      id: 'seed-session-3',
      therapy_id: therapy1.id,
      scheduled_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: SessionStatus.CANCELLED,
      session_fee: 500.00,
      cancelled_by: psy1User.id,
      cancelled_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      cancel_reason: 'Emergencia de la psicóloga',
    }
  });

  // 5. Session Notes
  await prisma.sessionNote.upsert({
    where: { id: 'seed-note-1' },
    update: {},
    create: {
      id: 'seed-note-1',
      session_id: completedSession.id,
      author_id: psy1User.id,
      content: 'La consultante muestra avances significativos.',
      is_private: false
    }
  });

  await prisma.sessionNote.upsert({
    where: { id: 'seed-note-2' },
    update: {},
    create: {
      id: 'seed-note-2',
      session_id: completedSession.id,
      author_id: psy1User.id,
      content: 'Observación privada: explorar trauma infantil.',
      is_private: true
    }
  });

  // 6. Payment
  await prisma.payment.upsert({
    where: { session_id: completedSession.id },
    update: {},
    create: {
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
  const goal1 = await prisma.goal.upsert({
    where: { id: 'seed-goal-1' },
    update: {},
    create: {
      id: 'seed-goal-1',
      therapy_id: therapy1.id,
      title: 'Reducir ansiedad social',
      description: 'Trabajar en técnicas de respiración y exposición gradual.',
      status: 'IN_PROGRESS',
      progress: 40
    }
  });

  const goal2 = await prisma.goal.upsert({
    where: { id: 'seed-goal-2' },
    update: {},
    create: {
      id: 'seed-goal-2',
      therapy_id: therapy1.id,
      title: 'Mejorar asertividad',
      description: 'Aprender a establecer límites claros en relaciones personales.',
      status: 'PENDING',
      progress: 10
    }
  });

  // Goal Progress Entries (Idempotent)
  const entries = [
    { id: 'goal-entry-1', goal_id: goal1.id, progress: 20, notes: 'Inicio de tratamiento', created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    { id: 'goal-entry-2', goal_id: goal1.id, progress: 40, notes: 'Mejora en técnicas de respiración', created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    { id: 'goal-entry-3', goal_id: goal2.id, progress: 0, notes: 'Establecimiento de línea base', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
    { id: 'goal-entry-4', goal_id: goal2.id, progress: 10, notes: 'Primeros ejercicios de asertividad', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
  ];

  for (const entry of entries) {
    await prisma.goalProgressEntry.upsert({
      where: { id: entry.id },
      update: {},
      create: entry
    });
  }

  // 8. Notifications (Idempotent)
  const notifications = [
    { id: 'notif-1', type: NotificationType.SESSION_SCHEDULED, title: 'Sesión Programada', body: 'Tu próxima sesión ha sido confirmada.', read: false },
    { id: 'notif-2', type: NotificationType.PAYMENT_REGISTERED, title: 'Pago Registrado', body: 'Se ha registrado tu pago de $500.', read: true },
    { id: 'notif-3', type: NotificationType.GOAL_UPDATED, title: 'Objetivo Actualizado', body: 'Tu progreso en "Reducir ansiedad" ha sido actualizado.', read: false },
    { id: 'notif-4', type: NotificationType.NEW_MESSAGE, title: 'Nuevo Mensaje', body: 'Tu psicóloga te ha enviado un mensaje.', read: false },
    { id: 'notif-5', type: NotificationType.PROPOSITION_RECEIVED, title: 'Nuevos horarios propuestos', body: 'Revisa las opciones para tu próxima sesión.', read: false }
  ];

  for (const n of notifications) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: {},
      create: {
        user_id: consultant1User.id,
        ...n
      }
    });
  }

  // 9. Events
  await prisma.event.upsert({
    where: { id: 'seed-event-1' },
    update: {},
    create: {
      id: 'seed-event-1',
      title: 'Taller de Psicología Feminista',
      description: 'Un taller gratuito sobre los fundamentos de la psicología feminista.',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      cost: 0,
      location: 'En línea',
    }
  });

  await prisma.event.upsert({
    where: { id: 'seed-event-2' },
    update: {},
    create: {
      id: 'seed-event-2',
      title: 'Seminario de Cuidado Informado en Trauma',
      description: 'Un seminario pagado sobre técnicas de cuidado para sobrevivientes de trauma.',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
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

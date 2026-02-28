-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PSYCHOLOGIST', 'ADMIN_PSYCHOLOGIST', 'CONSULTANT');

-- CreateEnum
CREATE TYPE "TherapyStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TherapyOrigin" AS ENUM ('PSYCHOLOGIST_INITIATED', 'CONSULTANT_INITIATED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "TherapyRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SessionRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PropositionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('INCOMPLETE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('RECURRING', 'PER_SESSION');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'DIGITAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'WAIVED');

-- CreateEnum
CREATE TYPE "PaymentScope" AS ENUM ('THERAPY_SESSION', 'EVENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('THERAPY_REQUEST_RECEIVED', 'THERAPY_REQUEST_ACCEPTED', 'THERAPY_REQUEST_REJECTED', 'PROPOSITION_RECEIVED', 'PROPOSITION_ACCEPTED', 'SESSION_REQUEST_RECEIVED', 'SESSION_REQUEST_ACCEPTED', 'SESSION_REQUEST_REJECTED', 'SESSION_SCHEDULED', 'SESSION_CANCELLED', 'SESSION_POSTPONED', 'SESSION_COMPLETED', 'NOTE_ADDED', 'PAYMENT_REGISTERED', 'PAYMENT_PENDING', 'GOAL_UPDATED', 'NEW_MESSAGE', 'EVENT_REGISTRATION_CONFIRMED', 'EVENT_REGISTRATION_CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "avatar_url" TEXT,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PsychologistProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "specializations" TEXT[],
    "bio" TEXT,
    "session_fee" DECIMAL(10,2) NOT NULL,
    "modalities" TEXT[],
    "languages" TEXT[],
    "years_experience" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PsychologistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultantProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3),
    "phone" TEXT,
    "emergency_contact" TEXT,
    "onboarding_status" "OnboardingStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "onboarding_step" INTEGER NOT NULL DEFAULT 1,
    "onboarding_data" JSONB,

    CONSTRAINT "ConsultantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Therapy" (
    "id" TEXT NOT NULL,
    "psychologist_id" TEXT NOT NULL,
    "consultant_id" TEXT NOT NULL,
    "origin" "TherapyOrigin" NOT NULL,
    "modality" TEXT NOT NULL,
    "notes" TEXT,
    "status" "TherapyStatus" NOT NULL DEFAULT 'PENDING',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Therapy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingPlan" (
    "id" TEXT NOT NULL,
    "therapy_id" TEXT NOT NULL,
    "billing_type" "BillingType" NOT NULL,
    "default_fee" DECIMAL(10,2) NOT NULL,
    "recurrence" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TherapySession" (
    "id" TEXT NOT NULL,
    "therapy_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "session_fee" DECIMAL(10,2),
    "cancelled_by" TEXT,
    "cancel_reason" TEXT,
    "postponed_to" TIMESTAMP(3),
    "media_urls" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TherapySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionNote" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "psychologist_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,

    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TherapyRequest" (
    "id" TEXT NOT NULL,
    "psychologist_id" TEXT NOT NULL,
    "consultant_id" TEXT NOT NULL,
    "message" TEXT,
    "status" "TherapyRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TherapyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionRequest" (
    "id" TEXT NOT NULL,
    "therapy_id" TEXT NOT NULL,
    "consultant_id" TEXT NOT NULL,
    "proposed_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" "SessionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleProposition" (
    "id" TEXT NOT NULL,
    "therapy_id" TEXT NOT NULL,
    "proposed_slots" TIMESTAMP(3)[],
    "selected_slot" TIMESTAMP(3),
    "status" "PropositionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleProposition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "therapy_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "GoalStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalProgressEntry" (
    "id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "progress" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalProgressEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "session_id" TEXT,
    "event_id" TEXT,
    "consultant_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod",
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "scope" "PaymentScope" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "recurrence" TEXT,
    "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_participants" INTEGER,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "therapy_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "media_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PsychologistProfile_user_id_key" ON "PsychologistProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultantProfile_user_id_key" ON "ConsultantProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "BillingPlan_therapy_id_key" ON "BillingPlan"("therapy_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_session_id_key" ON "Payment"("session_id");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PsychologistProfile" ADD CONSTRAINT "PsychologistProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultantProfile" ADD CONSTRAINT "ConsultantProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Therapy" ADD CONSTRAINT "Therapy_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Therapy" ADD CONSTRAINT "Therapy_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingPlan" ADD CONSTRAINT "BillingPlan_therapy_id_fkey" FOREIGN KEY ("therapy_id") REFERENCES "Therapy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapySession" ADD CONSTRAINT "TherapySession_therapy_id_fkey" FOREIGN KEY ("therapy_id") REFERENCES "Therapy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionNote" ADD CONSTRAINT "SessionNote_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "TherapySession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionNote" ADD CONSTRAINT "SessionNote_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "PsychologistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapyRequest" ADD CONSTRAINT "TherapyRequest_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapyRequest" ADD CONSTRAINT "TherapyRequest_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionRequest" ADD CONSTRAINT "SessionRequest_therapy_id_fkey" FOREIGN KEY ("therapy_id") REFERENCES "Therapy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionRequest" ADD CONSTRAINT "SessionRequest_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleProposition" ADD CONSTRAINT "ScheduleProposition_therapy_id_fkey" FOREIGN KEY ("therapy_id") REFERENCES "Therapy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_therapy_id_fkey" FOREIGN KEY ("therapy_id") REFERENCES "Therapy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalProgressEntry" ADD CONSTRAINT "GoalProgressEntry_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "TherapySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_therapy_id_fkey" FOREIGN KEY ("therapy_id") REFERENCES "Therapy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

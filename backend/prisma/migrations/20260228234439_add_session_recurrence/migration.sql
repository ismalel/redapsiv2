-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('INITIAL', 'RECURRENT', 'EXTRAORDINARY');

-- AlterTable
ALTER TABLE "TherapySession" ADD COLUMN     "type" "SessionType" NOT NULL DEFAULT 'INITIAL';

-- CreateTable
CREATE TABLE "RecurrenceConfiguration" (
    "id" TEXT NOT NULL,
    "therapy_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "frequency" TEXT NOT NULL DEFAULT 'WEEKLY',
    "sessions_count" INTEGER,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" "TherapyStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurrenceConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecurrenceConfiguration_therapy_id_key" ON "RecurrenceConfiguration"("therapy_id");

-- AddForeignKey
ALTER TABLE "RecurrenceConfiguration" ADD CONSTRAINT "RecurrenceConfiguration_therapy_id_fkey" FOREIGN KEY ("therapy_id") REFERENCES "Therapy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

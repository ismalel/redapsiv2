-- AlterTable
ALTER TABLE "ScheduleProposition" ADD COLUMN     "type" "SessionType" NOT NULL DEFAULT 'INITIAL';

-- AlterTable
ALTER TABLE "SessionRequest" ADD COLUMN     "type" "SessionType" NOT NULL DEFAULT 'INITIAL';

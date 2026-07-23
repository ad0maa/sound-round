-- AlterTable
ALTER TABLE "League" ADD COLUMN     "startsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Round" ADD COLUMN     "submissionDurationHours" INTEGER,
ADD COLUMN     "votingDurationHours" INTEGER;

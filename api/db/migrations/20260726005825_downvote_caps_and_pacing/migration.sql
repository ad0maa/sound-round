-- CreateEnum
CREATE TYPE "Pacing" AS ENUM ('chill', 'fast', 'fastest');

-- AlterTable
ALTER TABLE "League" ADD COLUMN     "maxDownvotesPerSong" INTEGER,
ADD COLUMN     "pacing" "Pacing" NOT NULL DEFAULT 'fastest';

-- Back-fill: "maxPointsPerSong" used to cap ABS(points), so it capped downvotes
-- too. Copy it across so existing leagues keep the downvote cap they had.
UPDATE "League" SET "maxDownvotesPerSong" = "maxPointsPerSong";

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];

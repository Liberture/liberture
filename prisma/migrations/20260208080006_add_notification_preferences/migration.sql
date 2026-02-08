-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "marketingEmails" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "newContentAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weeklyDigest" BOOLEAN NOT NULL DEFAULT true;

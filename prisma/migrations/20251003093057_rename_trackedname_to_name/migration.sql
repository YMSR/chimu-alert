-- Rename TrackedName table to Name and update related constraints
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_trackedNameId_fkey";

ALTER TABLE "TrackedName" RENAME TO "Name";
ALTER TABLE "Name" RENAME CONSTRAINT "TrackedName_pkey" TO "Name_pkey";
ALTER TABLE "Name" RENAME CONSTRAINT "TrackedName_userId_fkey" TO "Name_userId_fkey";
ALTER INDEX "TrackedName_userId_idx" RENAME TO "Name_userId_idx";
ALTER INDEX "TrackedName_isActive_idx" RENAME TO "Name_isActive_idx";

ALTER TABLE "Notification" RENAME COLUMN "trackedNameId" TO "nameId";
ALTER TABLE "Notification" RENAME CONSTRAINT "Notification_userId_trackedNameId_obituaryId_key" TO "Notification_userId_nameId_obituaryId_key";

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES "Name"("id") ON DELETE CASCADE ON UPDATE CASCADE;

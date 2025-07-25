/*
  Warnings:

  - The primary key for the `GearSetTag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Tag` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "GearSetTag" DROP CONSTRAINT "GearSetTag_tagId_fkey";

-- AlterTable
ALTER TABLE "GearSetTag" DROP CONSTRAINT "GearSetTag_pkey",
ALTER COLUMN "tagId" SET DATA TYPE TEXT,
ADD CONSTRAINT "GearSetTag_pkey" PRIMARY KEY ("gearSetId", "tagId");

-- AlterTable
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Tag_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Tag_id_seq";

-- AddForeignKey
ALTER TABLE "GearSetTag" ADD CONSTRAINT "GearSetTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

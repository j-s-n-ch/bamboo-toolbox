-- CreateEnum
CREATE TYPE "GearSlotType" AS ENUM ('head', 'cape', 'back', 'chest', 'primary', 'secondary', 'hands', 'legs', 'neck', 'feet', 'ring', 'tool', 'potion', 'consumable', 'service');

-- CreateTable
CREATE TABLE "GearSet" (
    "id" SERIAL NOT NULL,
    "userUuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER,

    CONSTRAINT "GearSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GearSetItem" (
    "id" SERIAL NOT NULL,
    "gearSetId" INTEGER NOT NULL,
    "slotType" "GearSlotType" NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "quality" TEXT NOT NULL,

    CONSTRAINT "GearSetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GearSetTag" (
    "gearSetId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "GearSetTag_pkey" PRIMARY KEY ("gearSetId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "GearSetItem_gearSetId_slotType_slotIndex_key" ON "GearSetItem"("gearSetId", "slotType", "slotIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- AddForeignKey
ALTER TABLE "GearSet" ADD CONSTRAINT "GearSet_userUuid_fkey" FOREIGN KEY ("userUuid") REFERENCES "User"("userUuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GearSetItem" ADD CONSTRAINT "GearSetItem_gearSetId_fkey" FOREIGN KEY ("gearSetId") REFERENCES "GearSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GearSetTag" ADD CONSTRAINT "GearSetTag_gearSetId_fkey" FOREIGN KEY ("gearSetId") REFERENCES "GearSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GearSetTag" ADD CONSTRAINT "GearSetTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "User" (
    "uuid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "PlayerStats" (
    "uuid" TEXT NOT NULL,
    "achievementPoints" INTEGER NOT NULL,
    "skillAgility" INTEGER NOT NULL,
    "skillCarpentry" INTEGER NOT NULL,
    "skillCooking" INTEGER NOT NULL,
    "skillCrafting" INTEGER NOT NULL,
    "skillFishing" INTEGER NOT NULL,
    "skillForaging" INTEGER NOT NULL,
    "skillMining" INTEGER NOT NULL,
    "skillSmithing" INTEGER NOT NULL,
    "skillTrinketry" INTEGER NOT NULL,
    "skillWoodcutting" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerStats_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "OwnedItem" (
    "uuid" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quality1" TEXT,
    "quality2" TEXT,

    CONSTRAINT "OwnedItem_pkey" PRIMARY KEY ("uuid","itemId")
);

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_uuid_fkey" FOREIGN KEY ("uuid") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnedItem" ADD CONSTRAINT "OwnedItem_uuid_fkey" FOREIGN KEY ("uuid") REFERENCES "User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

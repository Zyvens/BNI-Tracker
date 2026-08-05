-- CreateTable
CREATE TABLE "Possibility" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "company" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'explorando',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Possibility_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Possibility" ADD CONSTRAINT "Possibility_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

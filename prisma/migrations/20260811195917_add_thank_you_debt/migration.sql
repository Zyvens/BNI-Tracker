-- CreateTable
CREATE TABLE "ThankYouDebt" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyValue" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThankYouDebt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThankYouDebtMonth" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "thanked" BOOLEAN NOT NULL DEFAULT false,
    "thankedAt" TIMESTAMP(3),

    CONSTRAINT "ThankYouDebtMonth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThankYouDebtMonth_debtId_monthKey_key" ON "ThankYouDebtMonth"("debtId", "monthKey");

-- AddForeignKey
ALTER TABLE "ThankYouDebt" ADD CONSTRAINT "ThankYouDebt_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThankYouDebtMonth" ADD CONSTRAINT "ThankYouDebtMonth_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "ThankYouDebt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

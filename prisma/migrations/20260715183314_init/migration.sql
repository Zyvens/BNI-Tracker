-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "whatsapp" TEXT,
    "company" TEXT,
    "category" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceRecord" (
    "id" TEXT NOT NULL,
    "memberId" TEXT,
    "reportId" TEXT NOT NULL,
    "memberName" TEXT NOT NULL,
    "presences" INTEGER NOT NULL,
    "absences" INTEGER NOT NULL,
    "late" INTEGER NOT NULL,
    "monitored" INTEGER NOT NULL,
    "substitutions" INTEGER NOT NULL,
    "referralsGiven" INTEGER NOT NULL,
    "referralsReceived" INTEGER NOT NULL,
    "oneToOnes" INTEGER NOT NULL,
    "visitors" INTEGER NOT NULL,
    "testimonials" INTEGER NOT NULL,
    "ceu" INTEGER NOT NULL,
    "tyfcb" DOUBLE PRECISION NOT NULL,
    "pointsAbsences" INTEGER NOT NULL,
    "pointsLate" INTEGER NOT NULL,
    "pointsReferrals" INTEGER NOT NULL,
    "pointsOneToOnes" INTEGER NOT NULL,
    "pointsVisitors" INTEGER NOT NULL,
    "pointsTestimonials" INTEGER NOT NULL,
    "pointsCeu" INTEGER NOT NULL,
    "pointsTyfcb" INTEGER NOT NULL,
    "totalPoints" INTEGER NOT NULL,

    CONSTRAINT "PerformanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeekEntry" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "dateISO" TEXT NOT NULL,
    "presenca" TEXT NOT NULL DEFAULT 'P',
    "atrasado" BOOLEAN NOT NULL DEFAULT false,
    "ueg" BOOLEAN NOT NULL DEFAULT false,
    "testemunho" BOOLEAN NOT NULL DEFAULT false,
    "rdi" INTEGER NOT NULL DEFAULT 0,
    "rde" INTEGER NOT NULL DEFAULT 0,
    "rri" INTEGER NOT NULL DEFAULT 0,
    "rre" INTEGER NOT NULL DEFAULT 0,
    "convidados" INTEGER NOT NULL DEFAULT 0,
    "reunioes1a1" INTEGER NOT NULL DEFAULT 0,
    "onf" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeekEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "giverId" TEXT,
    "giverName" TEXT,
    "receiverId" TEXT,
    "receiverName" TEXT,
    "contactName" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "category" TEXT,
    "segment" TEXT,
    "origem" TEXT NOT NULL DEFAULT 'referencia_direta',
    "dataISO" TEXT NOT NULL,
    "estimatedValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "potential" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'recebida',
    "nextAction" TEXT,
    "nextActionISO" TEXT,
    "lostReason" TEXT,
    "firstContactISO" TEXT,
    "closedISO" TEXT,
    "declaredValue" DOUBLE PRECISION,
    "declaredISO" TEXT,
    "receivedISO" TEXT,
    "dealType" TEXT,
    "inOfficialSystem" BOOLEAN NOT NULL DEFAULT false,
    "heardInMeeting" BOOLEAN NOT NULL DEFAULT false,
    "confirmationStatus" TEXT NOT NULL DEFAULT 'nao_aplicavel',
    "confirmedValue" DOUBLE PRECISION,
    "confirmedISO" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralLog" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "dataISO" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'nota',
    "texto" TEXT NOT NULL,
    "autorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "category" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "inviteISO" TEXT NOT NULL,
    "meetingISO" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "interested" BOOLEAN NOT NULL DEFAULT false,
    "becameMember" BOOLEAN NOT NULL DEFAULT false,
    "receivedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OneToOne" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "withMemberId" TEXT,
    "withName" TEXT,
    "dataISO" TEXT NOT NULL,
    "local" TEXT,
    "duracao" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OneToOne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiOverride" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "kpiId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KpiOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "dedupeKey" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "groupName" TEXT NOT NULL DEFAULT 'BNI',
    "goalRefs" INTEGER NOT NULL DEFAULT 27,
    "goalConvidados" INTEGER NOT NULL DEFAULT 8,
    "goal1a1" INTEGER NOT NULL DEFAULT 22,
    "goalUegs" INTEGER NOT NULL DEFAULT 22,
    "goalTestemunhos" INTEGER NOT NULL DEFAULT 2,
    "goalOpnf" DOUBLE PRECISION NOT NULL DEFAULT 20000,
    "targetScore" INTEGER NOT NULL DEFAULT 100,
    "safetyMargin" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_memberId_key" ON "User"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_month_year_key" ON "Report"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceRecord_memberName_reportId_key" ON "PerformanceRecord"("memberName", "reportId");

-- CreateIndex
CREATE UNIQUE INDEX "WeekEntry_memberId_dateISO_key" ON "WeekEntry"("memberId", "dateISO");

-- CreateIndex
CREATE UNIQUE INDEX "KpiOverride_memberId_kpiId_key" ON "KpiOverride"("memberId", "kpiId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceRecord" ADD CONSTRAINT "PerformanceRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceRecord" ADD CONSTRAINT "PerformanceRecord_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeekEntry" ADD CONSTRAINT "WeekEntry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralLog" ADD CONSTRAINT "ReferralLog_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OneToOne" ADD CONSTRAINT "OneToOne_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OneToOne" ADD CONSTRAINT "OneToOne_withMemberId_fkey" FOREIGN KEY ("withMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "VoiceNote" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "contactName" TEXT,
    "audioData" TEXT,
    "durationSec" INTEGER,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceNote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VoiceNote" ADD CONSTRAINT "VoiceNote_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

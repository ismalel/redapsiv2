-- CreateTable
CREATE TABLE "TherapyNote" (
    "id" TEXT NOT NULL,
    "therapy_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TherapyNote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TherapyNote" ADD CONSTRAINT "TherapyNote_therapy_id_fkey" FOREIGN KEY ("therapy_id") REFERENCES "Therapy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapyNote" ADD CONSTRAINT "TherapyNote_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

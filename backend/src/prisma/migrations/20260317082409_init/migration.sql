-- CreateEnum
CREATE TYPE "Role" AS ENUM ('parent', 'teacher', 'admin');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('at_school', 'called', 'picked_up');

-- CreateEnum
CREATE TYPE "PickupStatus" AS ENUM ('coming', 'arrived', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "NotifType" AS ENUM ('pickup_request', 'student_ready', 'pickup_confirmed', 'announcement');

-- CreateEnum
CREATE TYPE "NotifStatus" AS ENUM ('read', 'unread');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'parent',
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "photo" TEXT,
    "qrCode" TEXT NOT NULL,
    "status" "StudentStatus" NOT NULL DEFAULT 'at_school',
    "parentId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupRequest" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "parentId" INTEGER NOT NULL,
    "status" "PickupStatus" NOT NULL DEFAULT 'coming',
    "eta" INTEGER,
    "carPlate" TEXT,
    "carColor" TEXT,
    "requestTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupHistory" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "parentId" INTEGER NOT NULL,
    "teacherId" INTEGER,
    "pickupTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "carPlate" TEXT,
    "notes" TEXT,

    CONSTRAINT "PickupHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotifType" NOT NULL,
    "status" "NotifStatus" NOT NULL DEFAULT 'unread',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Student_qrCode_key" ON "Student"("qrCode");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupHistory" ADD CONSTRAINT "PickupHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupHistory" ADD CONSTRAINT "PickupHistory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupHistory" ADD CONSTRAINT "PickupHistory_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

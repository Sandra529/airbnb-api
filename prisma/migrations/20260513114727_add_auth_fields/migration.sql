/*
  Warnings:

  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "phone",
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

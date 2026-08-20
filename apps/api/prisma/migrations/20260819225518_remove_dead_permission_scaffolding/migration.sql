/*
  Warnings:

  - You are about to drop the column `permissionsOverride` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `RolePermission` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_orgId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "permissionsOverride";

-- DropTable
DROP TABLE "RolePermission";

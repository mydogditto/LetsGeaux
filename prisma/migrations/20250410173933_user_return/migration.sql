/*
  Warnings:

  - You are about to alter the column `profilePic` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(150)`.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `profilePic` VARCHAR(150) NULL;

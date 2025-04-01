-- CreateEnum
CREATE TYPE "State" AS ENUM ('OPEN', 'CLOSED', 'CANCEL_ONLY', 'LIMIT_ONLY');

-- CreateEnum
CREATE TYPE "Side" AS ENUM ('BID', 'ASK');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('NEW', 'PART_FILLED', 'FILLED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Market" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "volume" BIGINT NOT NULL,
    "price" DECIMAL(6,2) NOT NULL,
    "state" "State" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "price" DECIMAL(6,2) NOT NULL,
    "quantity" DECIMAL(6,2) NOT NULL,
    "executed_quantity" DECIMAL(6,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'NEW',
    "side" "Side" NOT NULL,
    "marketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Market_symbol_key" ON "Market"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Order_client_id_key" ON "Order"("client_id");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_side_idx" ON "Order"("side");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_password_key" ON "User"("username", "password");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

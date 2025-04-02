-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "price" DECIMAL(6,2) NOT NULL,
    "quantity" DECIMAL(6,2) NOT NULL,
    "timestamp" DECIMAL(6,2) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

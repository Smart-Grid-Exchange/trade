import { prisma } from "../src";

async function main() {
    // Create Market
    const market = await prisma.market.upsert({
      where: { symbol: "INR_KWH" },
      update: {},
      create: {
        symbol: "INR_KWH",
        volume: 1000000n,
        price: 10.50,
        state: "OPEN",
      },
    });
  
    // Create Users
    const user1 = await prisma.user.upsert({
      where: { username: "user1" },
      update: {},
      create: {
        username: "user1",
        password: "hashedpassword1",
      },
    });
  
    const user2 = await prisma.user.upsert({
      where: { username: "user2" },
      update: {},
      create: {
        username: "user2",
        password: "hashedpassword2",
      },
    });
  
    // Create Orders
    const orders = Array.from({ length: 15 }).map((_, i) => ({
      id: `order_${i + 1}`,
      client_id: `client_${i + 1}`,
      price: (10 + i * 0.1).toFixed(2),
      quantity: (1 + i * 0.5).toFixed(2),
      executed_quantity: "0.00",
      status: "NEW" as const,
      side: (i % 2 === 0 ? "BID" as const: "ASK" as const) ,
      marketId: market.symbol,
      userId: i % 2 === 0 ? user1.username : user2.username,
    }));
  
    await prisma.order.createMany({
      data: orders,
      skipDuplicates: true,
    });
  
    console.log("Database seeded successfully");
  }
  
  main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect();
  })
  
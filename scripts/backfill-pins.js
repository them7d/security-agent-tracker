// One-shot: backfill agent PINs from badge IDs
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const agents = await db.agent.findMany();
  for (const a of agents) {
    const pin = a.badgeId.replace(/\D/g, "").slice(-4).padStart(4, "0");
    if (a.pin !== pin) {
      await db.agent.update({ where: { id: a.id }, data: { pin } });
      console.log(`Updated ${a.badgeId} → pin=${pin}`);
    } else {
      console.log(`OK ${a.badgeId} → pin=${pin}`);
    }
  }
  // Also ensure supervisor exists
  const bcrypt = require("bcryptjs");
  const email = "supervisor@sentinel.sec";
  let sup = await db.supervisor.findUnique({ where: { email } });
  if (!sup) {
    const passwordHash = await bcrypt.hash("Sentinel#2025", 10);
    sup = await db.supervisor.create({
      data: { email, name: "Operations Supervisor", passwordHash },
    });
    console.log(`Created supervisor ${sup.email}`);
  } else {
    console.log(`Supervisor exists: ${sup.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

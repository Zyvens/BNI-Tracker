// Cria o login mestre (coordenador) e as configurações padrão.
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1, groupName: "BNI FIRE" },
    update: {},
  });

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    create: {
      username: "admin",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
      mustChangePassword: true,
    },
    update: {},
  });

  console.log("Seed concluído.");
  console.log("Login mestre -> usuário: admin | senha: admin123 (troque no primeiro acesso)");
  return admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

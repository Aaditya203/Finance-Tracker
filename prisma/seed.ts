import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123", 12);

  // 1. Update Ujjwal's email & name specifically if existing
  const ujjwal = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "flextudy6@gmail.com" },
        { email: "ujjwal2k04@gmail.com" },
        { name: { contains: "Ujjual", mode: "insensitive" } },
        { name: { contains: "Ujjwal", mode: "insensitive" } },
      ],
    },
  });

  if (ujjwal) {
    await prisma.user.update({
      where: { id: ujjwal.id },
      data: {
        name: "Ujjwal Kumar Singh",
        email: "ujjwal2k04@gmail.com",
      },
    });
    console.log("Updated Ujjwal Kumar Singh:", "ujjwal2k04@gmail.com");
  } else {
    await prisma.user.create({
      data: {
        name: "Ujjwal Kumar Singh",
        email: "ujjwal2k04@gmail.com",
        passwordHash,
      },
    });
    console.log("Created Ujjwal Kumar Singh:", "ujjwal2k04@gmail.com");
  }

  // 2. Ensure Aditya and Vishal exist
  const aditya = await prisma.user.findFirst({ where: { email: "adityas20032005@gmail.com" } });
  if (!aditya) {
    await prisma.user.create({
      data: { name: "Aditya Sharma", email: "adityas20032005@gmail.com", passwordHash },
    });
  }

  const vishal = await prisma.user.findFirst({ where: { email: "2k03vishal@gmail.com" } });
  if (!vishal) {
    await prisma.user.create({
      data: { name: "Vishal Kumar Singh", email: "2k03vishal@gmail.com", passwordHash },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
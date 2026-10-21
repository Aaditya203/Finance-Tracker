import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const COMPANY_EMAIL = "flextudy.official@gmail.com";
const LEGACY_EMAIL = "flextudy6@gmail.com";

async function main() {
  const password = process.argv[2];
  if (!password || password.length < 12) {
    throw new Error("Pass a temporary password with at least 12 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existingOfficial = await prisma.user.findUnique({ where: { email: COMPANY_EMAIL } });
  const legacyBank = existingOfficial
    ? null
    : await prisma.user.findFirst({
        where: {
          email: LEGACY_EMAIL,
          name: { contains: "flextudy", mode: "insensitive" },
        },
      });

  if (existingOfficial) {
    await prisma.user.update({
      where: { id: existingOfficial.id },
      data: { name: "FlexStudy Official", passwordHash },
    });
    console.log("Updated FlexStudy Official bank account.");
  } else if (legacyBank) {
    await prisma.user.update({
      where: { id: legacyBank.id },
      data: { name: "FlexStudy Official", email: COMPANY_EMAIL, passwordHash },
    });
    console.log("Moved the legacy bank account to FlexStudy Official.");
  } else {
    await prisma.user.create({
      data: {
        name: "FlexStudy Official",
        email: COMPANY_EMAIL,
        passwordHash,
      },
    });
    console.log("Created FlexStudy Official bank account.");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

import { requiredAuth } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const { userId } = await requiredAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, telegramUserID } = body;

    const dataToUpdate: { name?: string; telegramUserID?: string | null } = {};

    if (typeof name === "string" && name.trim()) {
      dataToUpdate.name = name.trim();
    }

    if (telegramUserID !== undefined) {
      dataToUpdate.telegramUserID = telegramUserID ? telegramUserID.trim() : null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        telegramUserID: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

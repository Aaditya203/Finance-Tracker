import { requiredAuth } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requiredAuth();
    const { id } = await props.params;
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const teacherId = typeof body.teacherId === "string" ? body.teacherId.trim() : undefined;
    const email = typeof body.email === "string" ? body.email.trim() : undefined;
    const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
    const notes = typeof body.notes === "string" ? body.notes.trim() : undefined;

    if (name !== undefined && (!name || name.length > 120)) {
      return NextResponse.json({ error: "Teacher name is required (max 120 characters)." }, { status: 400 });
    }
    if (teacherId !== undefined && (!teacherId || teacherId.length > 60)) {
      return NextResponse.json({ error: "Teacher ID is required (max 60 characters)." }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (teacherId) {
      const existing = await prisma.teacher.findFirst({
        where: { teacherId, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json({ error: `Another teacher with ID "${teacherId}" already exists.` }, { status: 400 });
      }
    }

    const updated = await prisma.teacher.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(teacherId !== undefined ? { teacherId } : {}),
        ...(email !== undefined ? { email: email || null } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(notes !== undefined ? { notes: notes || null } : {}),
      },
    });

    return NextResponse.json({ teacher: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Teacher PUT error:", error);
    return NextResponse.json({ error: "Failed to update teacher" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requiredAuth();
    const { id } = await props.params;

    await prisma.teacher.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Teacher DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete teacher" }, { status: 500 });
  }
}

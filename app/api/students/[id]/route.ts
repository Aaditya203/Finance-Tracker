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
    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : undefined;
    const email = typeof body.email === "string" ? body.email.trim() : undefined;
    const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
    const notes = typeof body.notes === "string" ? body.notes.trim() : undefined;

    if (name !== undefined && (!name || name.length > 120)) {
      return NextResponse.json({ error: "Student name is required (max 120 characters)." }, { status: 400 });
    }
    if (studentId !== undefined && (!studentId || studentId.length > 60)) {
      return NextResponse.json({ error: "Student ID is required (max 60 characters)." }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (studentId) {
      const existing = await prisma.student.findFirst({
        where: { studentId, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json({ error: `Another student with ID "${studentId}" already exists.` }, { status: 400 });
      }
    }

    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(studentId !== undefined ? { studentId } : {}),
        ...(email !== undefined ? { email: email || null } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(notes !== undefined ? { notes: notes || null } : {}),
      },
    });

    return NextResponse.json({ student: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Student PUT error:", error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requiredAuth();
    const { id } = await props.params;

    await prisma.student.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Student DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}

import { requiredAuth } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    await requiredAuth();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.max(1, Math.min(100, Number.parseInt(searchParams.get("limit") || "10", 10) || 10));

    const where = query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { studentId: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {};

    if (!prisma?.student) {
      return NextResponse.json({
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 1,
      });
    }

    const [items, total] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { name: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Students GET error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requiredAuth();
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    if (!name || name.length > 120) {
      return NextResponse.json({ error: "Student name is required (max 120 characters)." }, { status: 400 });
    }
    if (!studentId || studentId.length > 60) {
      return NextResponse.json({ error: "Student ID is required (max 60 characters)." }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const existing = await prisma.student.findUnique({
      where: { studentId },
    });
    if (existing) {
      return NextResponse.json({ error: `A student with ID "${studentId}" already exists.` }, { status: 400 });
    }

    const student = await prisma.student.create({
      data: {
        name,
        studentId,
        email: email || null,
        phone: phone || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Students POST error:", error);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}

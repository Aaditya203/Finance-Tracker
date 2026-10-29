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
            { teacherId: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {};

    if (!prisma?.teacher) {
      return NextResponse.json({
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 1,
      });
    }

    const [items, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { name: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.teacher.count({ where }),
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
    console.error("Teachers GET error:", error);
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requiredAuth();
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const teacherId = typeof body.teacherId === "string" ? body.teacherId.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    if (!name || name.length > 120) {
      return NextResponse.json({ error: "Teacher name is required (max 120 characters)." }, { status: 400 });
    }
    if (!teacherId || teacherId.length > 60) {
      return NextResponse.json({ error: "Teacher ID is required (max 60 characters)." }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const existing = await prisma.teacher.findUnique({
      where: { teacherId },
    });
    if (existing) {
      return NextResponse.json({ error: `A teacher with ID "${teacherId}" already exists.` }, { status: 400 });
    }

    const teacher = await prisma.teacher.create({
      data: {
        name,
        teacherId,
        email: email || null,
        phone: phone || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ teacher }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Teachers POST error:", error);
    return NextResponse.json({ error: "Failed to create teacher" }, { status: 500 });
  }
}

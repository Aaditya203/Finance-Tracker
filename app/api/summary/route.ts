import { requiredAuth } from "@/lib/auth-service";
import { getDashboardData } from "@/lib/services/dashboard.service";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await requiredAuth();
    const { summary } = await getDashboardData(userId);
    return NextResponse.json(summary);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Summary API Error:", error);
    return NextResponse.json({ error: "Failed to calculate summary" }, { status: 500 });
  }
}

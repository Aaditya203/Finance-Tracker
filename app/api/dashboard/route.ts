import { requiredAuth } from "@/lib/auth-service";
import { getDashboardData } from "@/lib/services/dashboard.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const {userId} = await requiredAuth();

    const data = await getDashboardData(userId);

    return NextResponse.json(data);
  } catch (error) {
    if(error instanceof Error && error.message === "UNAUTHORIZED"){
        return NextResponse.json(
            {error: "Unauthorized"},
            {status: 401}
        )
    }
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

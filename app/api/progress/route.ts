import { NextRequest, NextResponse } from "next/server";

// This route returns user progress data.
// In production, this would query a database for stored analysis results.
// For now it returns a 404 so the frontend falls back to demo data.

export async function GET(_req: NextRequest) {
  // TODO: query stored analysis results from DB keyed by session/user
  // Example response shape matches DashboardData / ProgressData interfaces in the pages

  return NextResponse.json(
    { error: "No progress data yet — connect your account and analyse your games first" },
    { status: 404 }
  );
}

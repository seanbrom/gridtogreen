import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { generateAllPreviews } from "@/lib/briefing-pipeline";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await generateAllPreviews();

    revalidateTag("briefing", "max");

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Preview generation failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { generateFullBriefing } from "@/lib/briefing-pipeline";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const briefing = await generateFullBriefing();

    revalidateTag("briefing", "max");

    return NextResponse.json({
      success: true,
      slug: briefing.slug,
      briefing,
    });
  } catch (error) {
    console.error("Briefing generation failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

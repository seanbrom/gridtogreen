import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  generatePreviewBriefing,
  generateAllPreviews,
} from "@/lib/briefing-pipeline";
import { fetchAllMeetings } from "@/lib/openf1";

export const maxDuration = 300; // 5 minutes (Pro plan)

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { raceName, limit } = body as {
      raceName?: string;
      limit?: number;
    };

    // Single race mode: generate one preview by name
    if (raceName) {
      const meetings = await fetchAllMeetings();
      const meeting = meetings.find((m) =>
        m.meeting_name.toLowerCase().includes(raceName.toLowerCase())
      );
      if (!meeting) {
        return NextResponse.json(
          { success: false, error: `No meeting found for "${raceName}"` },
          { status: 404 }
        );
      }

      const briefing = await generatePreviewBriefing(meeting);
      revalidateTag("briefing", "max");

      return NextResponse.json({
        success: true,
        generated: [briefing.slug],
        skipped: [],
        failed: [],
      });
    }

    // Batch mode: generate all (with optional limit)
    const result = await generateAllPreviews(limit);

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

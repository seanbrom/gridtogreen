import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { generateFullBriefing } from "@/lib/briefing-pipeline";
import { fetchAllMeetings } from "@/lib/openf1";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Optional: target a specific race by meeting_key or race name
    const body = await request.json().catch(() => ({}));
    const { meetingKey, raceName } = body as {
      meetingKey?: number;
      raceName?: string;
    };

    let targetMeeting;
    if (meetingKey || raceName) {
      const meetings = await fetchAllMeetings();
      targetMeeting = meetings.find(
        (m) =>
          (meetingKey && m.meeting_key === meetingKey) ||
          (raceName &&
            m.meeting_name.toLowerCase().includes(raceName.toLowerCase()))
      );
      if (!targetMeeting) {
        return NextResponse.json(
          {
            success: false,
            error: `No meeting found for ${meetingKey ? `key ${meetingKey}` : `"${raceName}"`}`,
          },
          { status: 404 }
        );
      }
    }

    const briefing = await generateFullBriefing(targetMeeting);

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

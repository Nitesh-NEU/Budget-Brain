import { NextRequest, NextResponse } from "next/server";
import { ChannelPriorsSchema, PriorsResponseSchema } from "@/lib/zod";

function extractJsonBlock(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in Gemini response");
  return JSON.parse(match[0]);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get("company") || "generic";

    const prompt = `You are helping set media buying ranges.

Company: "${company}"

Return CPM (USD), CTR, and CVR ranges for Google, Meta, TikTok, LinkedIn for a company like the one described. Give realistic ranges for the US market in the last 12 months.

Output strict JSON:
{
  "priors": {
    "google": {"cpm":[low,high], "ctr":[low,high], "cvr":[low,high]},
    "meta":   {"cpm":[low,high], "ctr":[low,high], "cvr":[low,high]},
    "tiktok": {"cpm":[low,high], "ctr":[low,high], "cvr":[low,high]},
    "linkedin":{"cpm":[low,high], "ctr":[low,high], "cvr":[low,high]}
  },
  "citations":[
    {"title":"...", "url":"..."},
    {"title":"...", "url":"..."}
  ]
}
Rules:
- Use ranges, not single points.
- At least 2 trustworthy sources with URLs.
- CPM in USD per 1000 impressions. CTR and CVR in 0..1.
`;

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        cache: "no-store"
      }
    );

    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
    if (!text) throw new Error("Unexpected Gemini response");

    const parsed = extractJsonBlock(text);
    const priors = ChannelPriorsSchema.parse(parsed.priors);
    const citations = Array.isArray(parsed.citations) ? parsed.citations : [];

    // Validate response shape
    const response = PriorsResponseSchema.parse({ priors, citations });
    return NextResponse.json(response);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to fetch priors" }, { status: 400 });
  }
}

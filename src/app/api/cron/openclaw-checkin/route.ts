import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request) {
  try {
    // Basic Security: Check for a valid secret token in the Authorization header or query param
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret") || req.headers.get("authorization")?.split(" ")[1];

    if (secret !== process.env.INGESTION_SECRET && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const openClawBaseUrl = process.env.OPENCLAW_BASE_URL || "https://dashboard.fbrapps.com";
    const openClawApiKey = process.env.OPENCLAW_API_KEY;

    if (!openClawApiKey) {
      return NextResponse.json({ error: "OPENCLAW_API_KEY is not configured" }, { status: 500 });
    }

    // Fetch all active agents
    const activeAgents = await prisma.agent.findMany({
      where: { status: "active" },
      select: { id: true, code: true, displayName: true }
    });

    if (activeAgents.length === 0) {
      return NextResponse.json({ message: "No active agents found for check-in." }, { status: 200 });
    }

    const results = [];
    
    // Trigger the OpenClaw check-in for each active agent
    for (const agent of activeAgents) {
      try {
        const agentId = agent.code.toLowerCase();
        console.log(`[Cron] Triggering check-in for agent: ${agentId}`);
        
        const response = await fetch(`${openClawBaseUrl}/api/agents/${agentId}/checkin`, {
          method: "POST",
          headers: {
            "Authorization": `ApiKey ${openClawApiKey}`,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const data = await response.json();
          results.push({ agentCode: agentId, status: "success", openClawResponse: data });
        } else {
          const errorData = await response.text();
          results.push({ agentCode: agentId, status: "failed", error: errorData });
        }
      } catch (err: any) {
        results.push({ agentCode: agent.code, status: "error", error: err.message });
      }
    }

    return NextResponse.json({
      message: "Cron job executed successfully",
      totalProcessed: activeAgents.length,
      successCount: results.filter(r => r.status === "success").length,
      details: results
    }, { status: 200 });

  } catch (err: any) {
    console.error("[Cron OpenClaw Checkin] Critical Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

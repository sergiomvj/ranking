import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret") || req.headers.get("x-sync-secret");

  if (secret !== process.env.INGESTION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { stdout, stderr } = await execAsync("npx prisma migrate deploy", {
      timeout: 60_000,
    });

    return NextResponse.json({
      ok: true,
      message: "Migrations aplicadas com sucesso.",
      output: stdout,
      warnings: stderr || null,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message,
      output: err.stdout,
      stderr: err.stderr,
    }, { status: 500 });
  }
}

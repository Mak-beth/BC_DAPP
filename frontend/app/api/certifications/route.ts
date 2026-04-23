import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const uploadsDir = path.join(process.cwd(), "public", "uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      cid: string;
      fileName: string;
      fileBase64: string;
    };

    if (!body.cid || !body.fileName || !body.fileBase64) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    ensureUploadsDir();

    const buffer = Buffer.from(body.fileBase64, "base64");
    const filePath = path.join(uploadsDir, body.cid);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ success: true, cid: body.cid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

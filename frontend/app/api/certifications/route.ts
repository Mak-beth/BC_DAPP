import { NextRequest, NextResponse } from "next/server";
import { create } from "kubo-rpc-client";

export const runtime = "nodejs";

const ipfs = create({ url: process.env.IPFS_API_URL ?? "http://127.0.0.1:5001" });

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const added = await ipfs.add({ path: file.name, content: buffer }, { cidVersion: 1, pin: true });
    return NextResponse.json({ cid: added.cid.toString(), fileName: file.name });
  } catch (err) {
    const message = err instanceof Error ? err.message : "IPFS upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

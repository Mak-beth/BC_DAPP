import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

function isHex(addr: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet || !isHex(wallet)) {
    return NextResponse.json({ error: "wallet query param required" }, { status: 400 });
  }
  try {
    const [rows] = await pool.query(
      "SELECT * FROM contacts WHERE owner_wallet = ? ORDER BY name ASC",
      [wallet.toLowerCase()]
    );
    return NextResponse.json({ data: rows });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const owner_wallet = String(body.owner_wallet ?? "").toLowerCase();
    const contact_address = String(body.contact_address ?? "").toLowerCase();
    const name = String(body.name ?? "").trim();
    const role = String(body.role ?? "") as "MANUFACTURER" | "DISTRIBUTOR" | "RETAILER";
    const notes = body.notes ? String(body.notes) : null;

    if (!isHex(owner_wallet) || !isHex(contact_address)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }
    if (!name || !["MANUFACTURER","DISTRIBUTOR","RETAILER"].includes(role)) {
      return NextResponse.json({ error: "name and role required" }, { status: 400 });
    }
    if (owner_wallet === contact_address) {
      return NextResponse.json({ error: "Cannot add your own wallet as a contact" }, { status: 400 });
    }

    const [result]: any = await pool.query(
      "INSERT INTO contacts (owner_wallet, contact_address, name, role, notes) VALUES (?,?,?,?,?) " +
      "ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), notes = VALUES(notes)",
      [owner_wallet, contact_address, name, role, notes]
    );
    return NextResponse.json({ data: { id: result.insertId } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}

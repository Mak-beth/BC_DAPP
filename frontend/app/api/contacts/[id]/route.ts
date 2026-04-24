import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const body = await req.json();
  const owner_wallet = String(body.owner_wallet ?? "").toLowerCase();
  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const role = body.role as "MANUFACTURER"|"DISTRIBUTOR"|"RETAILER"|undefined;
  const notes = body.notes !== undefined ? String(body.notes) : undefined;

  const sets: string[] = [];
  const vals: unknown[] = [];
  if (name !== undefined) { sets.push("name = ?"); vals.push(name); }
  if (role !== undefined) { sets.push("role = ?"); vals.push(role); }
  if (notes !== undefined) { sets.push("notes = ?"); vals.push(notes); }
  if (sets.length === 0) return NextResponse.json({ data: { updated: 0 } });
  vals.push(id, owner_wallet);
  const [res]: any = await pool.query(
    `UPDATE contacts SET ${sets.join(", ")} WHERE id = ? AND owner_wallet = ?`,
    vals
  );
  return NextResponse.json({ data: { updated: res.affectedRows } });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const wallet = req.nextUrl.searchParams.get("wallet")?.toLowerCase();
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });
  const [res]: any = await pool.query(
    "DELETE FROM contacts WHERE id = ? AND owner_wallet = ?",
    [id, wallet]
  );
  return NextResponse.json({ data: { deleted: res.affectedRows } });
}

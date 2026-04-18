import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { DbProduct, CreateProductBody } from "@/lib/types";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json(
        { error: "wallet query param is required" },
        { status: 400 }
      );
    }

    const rows = await query<DbProduct>(
      "SELECT * FROM products WHERE creator_wallet = ? ORDER BY created_at DESC",
      [wallet]
    );

    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as CreateProductBody;

    if (!body.name || !body.creator_wallet || body.chain_product_id === undefined) {
      return NextResponse.json(
        { error: "name, creator_wallet, and chain_product_id are required" },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO products 
        (name, description, origin_country, batch_number, chain_product_id, creator_wallet) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        body.name,
        body.description || null,
        body.origin_country || null,
        body.batch_number || null,
        body.chain_product_id,
        body.creator_wallet,
      ]
    );

    const newRows = await query<DbProduct>(
      `SELECT * FROM products 
       WHERE chain_product_id = ? AND creator_wallet = ? 
       ORDER BY id DESC 
       LIMIT 1`,
      [body.chain_product_id, body.creator_wallet]
    );

    if (newRows.length === 0) {
      return NextResponse.json(
        { error: "Failed to load created product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: newRows[0] }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

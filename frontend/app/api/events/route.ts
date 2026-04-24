import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { DbEvent, CreateEventBody } from "@/lib/types";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const productIdStr = searchParams.get("product_id");

    if (productIdStr) {
      const productId = parseInt(productIdStr, 10);
      if (isNaN(productId)) {
        return NextResponse.json(
          { error: "Invalid product_id" },
          { status: 400 }
        );
      }

      const rows = await query<DbEvent>(
        "SELECT * FROM events_log WHERE product_id = ? ORDER BY created_at ASC",
        [productId]
      );
      return NextResponse.json({ data: rows }, { status: 200 });
    } else {
      const rows = await query<DbEvent & { batch_number: string }>(
        `SELECT e.*, p.batch_number 
         FROM events_log e
         LEFT JOIN products p ON e.product_id = p.id
         ORDER BY e.created_at DESC`
      );
      return NextResponse.json({ data: rows }, { status: 200 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as CreateEventBody & { chain_product_id?: number };

    let dbProductId = body.product_id;

    // If only chain_product_id is provided, look up the database id
    if (dbProductId === undefined && body.chain_product_id !== undefined) {
      const products = await query<{ id: number }>(
        "SELECT id FROM products WHERE chain_product_id = ? LIMIT 1",
        [body.chain_product_id]
      );
      if (products.length > 0) {
        dbProductId = products[0].id;
      }
    }

    if (dbProductId === undefined || !body.actor_address || !body.action) {
      return NextResponse.json(
        { error: "product_id (or chain_product_id), actor_address and action are required" },
        { status: 400 }
      );
    }

    await query(
      "INSERT INTO events_log (product_id, actor_address, action, notes) VALUES (?, ?, ?, ?)",
      [dbProductId, body.actor_address, body.action, body.notes || null]
    );

    const rows = await query<DbEvent>(
      "SELECT * FROM events_log WHERE product_id = ? ORDER BY id DESC LIMIT 1",
      [dbProductId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Failed to load created event" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

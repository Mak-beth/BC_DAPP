import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { DbProduct } from "@/lib/types";

interface RouteParams {
  params: { id: string };
}

// NextJS 14/15 typings typically pass params as a property in the 2nd arg for route handlers
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const chainProductId = parseInt(params.id, 10);

    if (isNaN(chainProductId)) {
      return NextResponse.json(
        { error: "Invalid product id" },
        { status: 400 }
      );
    }

    const rows = await query<DbProduct>(
      "SELECT * FROM products WHERE chain_product_id = ? LIMIT 1",
      [chainProductId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: rows[0] }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { DbUser, CreateUserBody } from "@/lib/types";

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

    const rows = await query<DbUser>(
      "SELECT * FROM users WHERE wallet_address = ? LIMIT 1",
      [wallet]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: rows[0] }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as CreateUserBody;

    if (!body.wallet_address || !body.company_name || !body.role) {
      return NextResponse.json(
        { error: "wallet_address, company_name and role are required" },
        { status: 400 }
      );
    }

    await query(
      "INSERT IGNORE INTO users (wallet_address, role, company_name) VALUES (?, ?, ?)",
      [body.wallet_address, body.role, body.company_name]
    );

    const rows = await query<DbUser>(
      "SELECT * FROM users WHERE wallet_address = ? LIMIT 1",
      [body.wallet_address]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Failed to load created user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

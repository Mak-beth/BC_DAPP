import mysql, { type RowDataPacket } from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || undefined,
  database: process.env.DB_NAME || "supplychain",
  connectionLimit: 10,
  waitForConnections: true,
});

export async function query<T>(sql: string, params?: unknown[]): Promise<T[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params as never);
  return rows as T[];
}

export async function createTables(): Promise<void> {
  try {
    await query<unknown>(`
      CREATE TABLE IF NOT EXISTS users (
        wallet_address VARCHAR(42) PRIMARY KEY,
        role ENUM('NONE','MANUFACTURER','DISTRIBUTOR','RETAILER') NOT NULL DEFAULT 'NONE',
        company_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await query<unknown>(`
      CREATE TABLE IF NOT EXISTS products (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        origin_country VARCHAR(100),
        batch_number VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        chain_product_id INT,
        creator_wallet VARCHAR(42) NULL,
        FOREIGN KEY (creator_wallet) REFERENCES users(wallet_address)
          ON DELETE SET NULL
          ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await query<unknown>(`
      CREATE TABLE IF NOT EXISTS events_log (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        actor_address VARCHAR(42) NOT NULL,
        action VARCHAR(255) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log("Database tables verified/created successfully.");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Failed to execute createTables:", error.message);
    } else {
      console.error("Failed to execute createTables:", error);
    }
  }
}

// Auto-run createTables() at bottom of file
createTables().catch(err => {
  console.error("Unexpected error in auto-init createTables:", err);
});

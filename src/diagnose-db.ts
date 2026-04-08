import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

async function diagnose() {
    console.log("Checking DATABASE_URL...");
    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is missing!");
        return;
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes("supabase.co") ? { rejectUnauthorized: false } : false
    });

    try {
        console.log("Connecting to database...");
        const client = await pool.connect();
        console.log("✅ Successfully connected to database.");

        console.log("Checking for BetterAuth tables...");
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('user', 'session', 'account', 'verification');
        `);

        const tables = res.rows.map(r => r.table_name);
        console.log("Found tables:", tables);

        const required = ['user', 'session', 'account', 'verification'];
        const missing = required.filter(t => !tables.includes(t));

        if (missing.length > 0) {
            console.error("❌ Missing required tables:", missing);
            console.log("\n>>> ACTION REQUIRED <<<");
            console.log("Please run the SQL commands in 'schema.sql' in your Supabase SQL Editor.");
            console.log("You can find 'schema.sql' in the root of your project.");
        } else {
            console.log("✅ All required tables are present.");
        }

        client.release();
    } catch (err) {
        console.error("❌ Database connection failed:", err.message);
    } finally {
        await pool.end();
    }
}

diagnose();

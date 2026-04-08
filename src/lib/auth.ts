import { betterAuth } from "better-auth";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * BetterAuth Backend Configuration
 * 
 * IMPORTANT: This file contains server-side code (pg Pool).
 * It should be used in a Node.js environment (e.g., Express, Fastify, or Supabase Edge Functions).
 */

if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not set in environment variables.");
}

if (!process.env.BETTER_AUTH_SECRET) {
    console.error("BETTER_AUTH_SECRET is not set in environment variables. This is required for better-auth.");
    // Depending on the application's requirements, you might want to throw an error here
    // throw new Error("BETTER_AUTH_SECRET is not set.");
}

export const auth = betterAuth({
    database: new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL?.includes("supabase.co") ? { rejectUnauthorized: false } : false
    }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_BASE_URL || "http://localhost:8080/api/auth",
    trustedOrigins: ["http://localhost:8080"],
    emailAndPassword: {
        enabled: true
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }
    },
});

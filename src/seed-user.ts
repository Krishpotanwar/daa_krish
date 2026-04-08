import { auth } from "./lib/auth";

async function seedUser() {
    console.log("Seeding test user...");

    const email = `test-${Date.now()}@example.com`;
    const password = "password123";
    const name = "Test User";

    try {
        const user = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name,
            }
        });

        console.log("✅ Test user created successfully!");
        console.log("Credentials:");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    } catch (error) {
        if (error.message?.includes("already exists")) {
            console.log("ℹ️ Test user already exists.");
            console.log("Credentials:");
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
        } else {
            console.error("❌ Failed to seed user:", error);
        }
    }
}

seedUser();

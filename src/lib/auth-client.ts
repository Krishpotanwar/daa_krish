import { createAuthClient } from "better-auth/react";

/**
 * BetterAuth Client Configuration
 * 
 * Used in your React components to handle login, logout, and session management.
 * baseURL should point to your backend API where BetterAuth is running.
 */

export const authClient = createAuthClient({
    // Replace with your actual backend URL where the BetterAuth API is hosted
    baseURL: window.location.origin
});

export const { signIn, signUp, signOut, useSession } = authClient;

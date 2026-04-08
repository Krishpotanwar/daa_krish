import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

const app = express();

app.use(cors({
    origin: "http://localhost:8080", // Vite dev server
    credentials: true
}));

app.use("/api/auth", toNodeHandler(auth));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`BetterAuth server running at http://localhost:${PORT}`);
});

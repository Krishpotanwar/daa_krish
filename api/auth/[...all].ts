import { auth } from "../../src/lib/auth.js";
import { toNodeHandler } from "better-auth/node";

export default toNodeHandler(auth);

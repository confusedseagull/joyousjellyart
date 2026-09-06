import "dotenv/config";
import { createApp } from "../server/_core/app";

// Vercel's Node.js runtime treats any exported (req, res) => void handler as
// a serverless function, and an Express app already is one — so no adapter
// is needed here. Static assets (the Vite build in dist/public) are served
// directly by Vercel's CDN per vercel.json, not through this function; this
// only ever receives the /api/* requests routed to it by that rewrite.
export default createApp();

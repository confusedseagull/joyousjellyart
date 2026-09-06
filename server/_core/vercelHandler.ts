import "dotenv/config";
import { createApp } from "./app";

// Bundled into a single self-contained api/index.js by vercel.json's
// buildCommand (esbuild, same tool/approach as the Railway build in
// package.json's "build" script). This project runs as native ESM
// ("type": "module" in package.json), and Node's ESM loader requires exact,
// extensioned relative import paths — but this codebase writes them
// extensionless throughout (matching tsx/bundler conventions). Vercel's
// Node.js function builder ships api/index.ts as a standalone file rather
// than bundling it, so at runtime it tried to resolve the literal path
// "../server/_core/app" and failed with ERR_MODULE_NOT_FOUND. Bundling here
// inlines the whole dependency graph into one file, leaving no relative
// imports for Node's loader to resolve at all.
export default createApp();

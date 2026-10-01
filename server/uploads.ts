import type { Request, Response } from "express";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Backs the customer-facing "upload reference images" picker in the
 * Customize wizard. Vercel Blob's client-upload flow: the browser calls
 * this route first to get a short-lived, constrained client token, then
 * uploads the file bytes directly to Blob storage (never through our
 * server) using that token.
 */
export async function handleReferenceImageUpload(req: Request, res: Response): Promise<void> {
  try {
    const jsonResponse = await handleUpload({
      body: req.body as HandleUploadBody,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        maximumSizeInBytes: MAX_SIZE_BYTES,
        addRandomSuffix: true,
      }),
    });
    res.json(jsonResponse);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

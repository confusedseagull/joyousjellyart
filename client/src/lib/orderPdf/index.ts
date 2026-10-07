import { buildOrderPdfModel, type PdfOrder } from "./orderPdfData";
import { fetchAsDataUrl, toCroppedPng, toFittedPng, REF_BOX } from "./images";

async function safe<T>(promise: Promise<T>): Promise<T | undefined> {
  try {
    return await promise;
  } catch {
    // A missing/blocked photo shouldn't stop the whole order PDF from generating.
    return undefined;
  }
}

/** Builds the order PDF. The PDF library is loaded on demand — it's large and only admins ever need it. */
export async function generateOrderPdf(order: PdfOrder): Promise<{ blob: Blob; fileName: string }> {
  const [{ pdf }, { OrderPdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./OrderPdfDocument"),
  ]);

  const model = buildOrderPdfModel(order);

  const [logo, watermark, itemImages, referenceImages] = await Promise.all([
    fetchAsDataUrl("/pdf/logo.png"),
    fetchAsDataUrl("/pdf/watermark.png"),
    Promise.all(
      model.items.map((item) =>
        item.imageSrc ? safe(toCroppedPng(item.imageSrc, { size: 400, shape: "circle" })) : Promise.resolve(undefined)
      )
    ),
    Promise.all(
      model.items.map(async (item) => {
        const thumbs = await Promise.all(item.referenceImages.map((url) => safe(toFittedPng(url, { maxSide: REF_BOX }))));
        return thumbs.map((t) => t ?? null);
      })
    ),
  ]);

  const blob = await pdf(OrderPdfDocument({ model, assets: { logo, watermark, itemImages, referenceImages } })).toBlob();
  return { blob, fileName: `Order-${model.orderNumber}.pdf` };
}

export async function downloadOrderPdf(order: PdfOrder): Promise<void> {
  const { blob, fileName } = await generateOrderPdf(order);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function printOrderPdf(order: PdfOrder): Promise<void> {
  const { blob } = await generateOrderPdf(order);
  const url = URL.createObjectURL(blob);
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  frame.src = url;
  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch {
      // Some browsers block printing a PDF inside an iframe — open it in a tab instead.
      window.open(url, "_blank");
    }
  };
  document.body.appendChild(frame);
  setTimeout(() => {
    frame.remove();
    URL.revokeObjectURL(url);
  }, 5 * 60_000);
}

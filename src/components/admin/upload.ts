import { supabase } from "@/integrations/supabase/client";
import { productImageUrl } from "@/lib/images";

/** Shrinks a photo to at most 1600px and re-encodes it as JPEG so the shop stays fast. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

/** Uploads a product photo and returns the address the shop uses to show it. */
export async function uploadProductImage(file: File) {
  const blob = await shrink(file);
  const path = `products/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from("product-images").upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return productImageUrl(path);
}

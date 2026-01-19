import { fetchAdminServerJson } from "@/lib/api/adminServerFetch";
import { uploadSingleFile } from "@/lib/api/adminUploads";
import type { MediaAsset } from "@/types/admin";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function createMediaAssetFromUpload(
  file: File,
  slugPrefix: string,
  suffix: string
) {
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const slugBase = slugify(baseName) || slugPrefix;
  const slug = `${slugBase}-${suffix}`;
  const upload = await uploadSingleFile(file);

  return fetchAdminServerJson<MediaAsset>("/media-assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug,
      kind: "image",
      provider: "upload",
      url: upload.url,
      sortOrder: 0,
      isActive: true,
    }),
  });
}

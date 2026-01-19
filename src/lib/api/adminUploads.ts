import { fetchAdminServerJson } from "@/lib/api/adminServerFetch";
import type { UploadItem } from "@/types/admin";

export async function uploadSingleFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return fetchAdminServerJson<UploadItem>("/upload/single", {
    method: "POST",
    body: formData,
  });
}

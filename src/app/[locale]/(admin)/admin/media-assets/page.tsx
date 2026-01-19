import Link from "next/link";
import { redirect } from "next/navigation";
import MediaAssetsCreateSheet from "@/components/admin/MediaAssetsCreateSheet";
import MediaAssetsEditDialog from "@/components/admin/MediaAssetsEditDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchAdminServerJson } from "@/lib/api/adminServerFetch";
import { uploadSingleFile } from "@/lib/api/adminUploads";
import {
  cleanI18n,
  readBoolean,
  readList,
  readNumber,
  readString,
} from "@/lib/admin/forms";
import { getLocalePrefix } from "@/lib/routes";
import type { MediaAsset, PaginatedResponse } from "@/types/admin";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ page?: string; limit?: string }>;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB");
}

async function createMediaAsset(formData: FormData) {
  "use server";
  const slug = readString(formData, "slug");
  const kind = readString(formData, "kind") || "image";
  const provider = readString(formData, "provider");
  const urlInput = readString(formData, "url");
  const altVi = readString(formData, "alt_vi");
  const altEn = readString(formData, "alt_en");
  const captionVi = readString(formData, "caption_vi");
  const captionEn = readString(formData, "caption_en");
  const tags = readList(formData, "tags");
  const sortOrder = readNumber(formData, "sortOrder");
  const isActive = readBoolean(formData, "isActive");
  const file = formData.get("file");

  let uploadedUrl = "";
  if (file instanceof File && file.size > 0) {
    const upload = await uploadSingleFile(file);
    uploadedUrl = upload.url;
  }

  await fetchAdminServerJson("/media-assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug,
      kind,
      provider: provider || undefined,
      url: uploadedUrl || urlInput,
      alt_i18n: cleanI18n({ vi: altVi, en: altEn }),
      caption_i18n: cleanI18n({ vi: captionVi, en: captionEn }),
      tags: tags.length ? tags : undefined,
      sortOrder: sortOrder ?? undefined,
      isActive,
    }),
  });

  redirect(String(formData.get("redirect") ?? "/admin/media-assets"));
}

async function updateMediaAsset(formData: FormData) {
  "use server";
  const id = readString(formData, "id");
  const slug = readString(formData, "slug");
  const kind = readString(formData, "kind") || "image";
  const provider = readString(formData, "provider");
  const urlInput = readString(formData, "url");
  const altVi = readString(formData, "alt_vi");
  const altEn = readString(formData, "alt_en");
  const captionVi = readString(formData, "caption_vi");
  const captionEn = readString(formData, "caption_en");
  const tags = readList(formData, "tags");
  const sortOrder = readNumber(formData, "sortOrder");
  const isActive = readBoolean(formData, "isActive");
  const file = formData.get("file");

  let uploadedUrl = "";
  if (file instanceof File && file.size > 0) {
    const upload = await uploadSingleFile(file);
    uploadedUrl = upload.url;
  }

  await fetchAdminServerJson(`/media-assets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug,
      kind,
      provider: provider || undefined,
      url: uploadedUrl || urlInput,
      alt_i18n: cleanI18n({ vi: altVi, en: altEn }),
      caption_i18n: cleanI18n({ vi: captionVi, en: captionEn }),
      tags: tags.length ? tags : undefined,
      sortOrder: sortOrder ?? undefined,
      isActive,
    }),
  });

  redirect(String(formData.get("redirect") ?? "/admin/media-assets"));
}

async function deleteMediaAsset(formData: FormData) {
  "use server";
  const id = readString(formData, "id");
  await fetchAdminServerJson(`/media-assets/${id}`, { method: "DELETE" });
  redirect(String(formData.get("redirect") ?? "/admin/media-assets"));
}

export default async function MediaAssetsPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const queryParams = (await searchParams) ?? {};
  const page = Math.max(1, Number(queryParams.page ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, Number(queryParams.limit ?? "20") || 20));
  const localePrefix = getLocalePrefix(locale as "vi" | "en");
  const adminBase = `${localePrefix}/admin`;
  const redirectPath = `${adminBase}/media-assets`;

  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  const data = await fetchAdminServerJson<PaginatedResponse<MediaAsset>>(
    `/media-assets?${qs.toString()}`
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Content
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            Media Assets
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage image and media records stored in the CMS.
          </p>
        </div>
        <MediaAssetsCreateSheet
          action={createMediaAsset}
          redirectPath={redirectPath}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Asset</th>
                <th className="px-4 py-3 text-left font-semibold">Tags</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Updated</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-muted-foreground"
                    colSpan={5}
                  >
                    No media assets yet.
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item._id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-md bg-muted/30">
                          {item.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.url}
                              alt={item.alt ?? item.slug}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {item.slug}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.kind} - {item.provider ?? "unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.url}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {item.tags?.length ? item.tags.join(", ") : "-"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                          item.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {formatDate(item.updatedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <MediaAssetsEditDialog
                        item={item}
                        action={updateMediaAsset}
                        deleteAction={deleteMediaAsset}
                        redirectPath={redirectPath}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          Page {data.page} of {Math.ceil(data.total / data.limit || 1)}
        </span>
        <div className="flex items-center gap-2">
          {data.page <= 1 ? (
            <Button size="sm" variant="outline" disabled>
              Previous
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link
                href={`${redirectPath}?page=${Math.max(1, data.page - 1)}&limit=${data.limit}`}
              >
                Previous
              </Link>
            </Button>
          )}
          {data.page >= Math.ceil(data.total / data.limit || 1) ? (
            <Button size="sm" variant="outline" disabled>
              Next
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link
                href={`${redirectPath}?page=${data.page + 1}&limit=${data.limit}`}
              >
                Next
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

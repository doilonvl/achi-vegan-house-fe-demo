import Link from "next/link";
import { redirect } from "next/navigation";
import TestimonialsCreateSheet from "@/components/admin/TestimonialsCreateSheet";
import TestimonialsEditDialog from "@/components/admin/TestimonialsEditDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchAdminServerJson } from "@/lib/api/adminServerFetch";
import {
  cleanI18n,
  readBoolean,
  readList,
  readNumber,
  readString,
} from "@/lib/admin/forms";
import { createMediaAssetFromUpload } from "@/lib/admin/mediaAssets";
import { getLocalePrefix } from "@/lib/routes";
import type { MediaAsset, PaginatedResponse, Testimonial } from "@/types/admin";

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

function slugify(text: string) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

async function createTestimonial(formData: FormData) {
  "use server";
  const timestamp = Date.now();
  const slug = slugify(readString(formData, "slug") ?? "");
  const quoteVi = readString(formData, "quote_vi");
  const quoteEn = readString(formData, "quote_en");
  const rating = readNumber(formData, "rating");
  const authorName = readString(formData, "authorName");
  const authorRoleVi = readString(formData, "authorRole_vi");
  const authorRoleEn = readString(formData, "authorRole_en");
  const avatarInitials = readString(formData, "avatarInitials");
  const source = readString(formData, "source");
  const isFeatured = readBoolean(formData, "isFeatured");
  const isActive = readBoolean(formData, "isActive");
  const sortOrder = readNumber(formData, "sortOrder");
  const avatarFile = formData.get("avatarFile");
  const mediaFiles = formData
    .getAll("mediaFiles")
    .filter((file): file is File => file instanceof File && file.size > 0);

  let avatarAssetId: string | undefined;
  if (avatarFile instanceof File && avatarFile.size > 0) {
    const asset = await createMediaAssetFromUpload(
      avatarFile,
      "testimonial-avatar",
      `${timestamp}-avatar`
    );
    avatarAssetId = asset._id;
  }

  const mediaAssetIds: string[] = [];
  for (const [index, file] of mediaFiles.entries()) {
    const asset = await createMediaAssetFromUpload(
      file,
      "testimonial-media",
      `${timestamp}-${index + 1}`
    );
    mediaAssetIds.push(asset._id);
  }

  await fetchAdminServerJson("/testimonials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug,
      quote_i18n: cleanI18n({ vi: quoteVi, en: quoteEn }),
      rating: rating ?? 5,
      authorName,
      authorRole_i18n: cleanI18n({ vi: authorRoleVi, en: authorRoleEn }),
      avatarInitials: avatarInitials || undefined,
      avatarAssetId: avatarAssetId || undefined,
      mediaAssetIds: mediaAssetIds.length ? mediaAssetIds : undefined,
      source: source || "google",
      isFeatured,
      isActive,
      sortOrder: sortOrder ?? undefined,
    }),
  });

  redirect(String(formData.get("redirect") ?? "/admin/testimonials"));
}

async function updateTestimonial(formData: FormData) {
  "use server";
  const timestamp = Date.now();
  const id = readString(formData, "id");
  const slug = slugify(readString(formData, "slug") ?? "");
  const quoteVi = readString(formData, "quote_vi");
  const quoteEn = readString(formData, "quote_en");
  const rating = readNumber(formData, "rating");
  const authorName = readString(formData, "authorName");
  const authorRoleVi = readString(formData, "authorRole_vi");
  const authorRoleEn = readString(formData, "authorRole_en");
  const avatarInitials = readString(formData, "avatarInitials");
  const existingAvatarAssetId = readString(formData, "existingAvatarAssetId");
  const existingMediaAssetIds = readList(formData, "existingMediaAssetIds");
  const source = readString(formData, "source");
  const isFeatured = readBoolean(formData, "isFeatured");
  const isActive = readBoolean(formData, "isActive");
  const sortOrder = readNumber(formData, "sortOrder");
  const avatarFile = formData.get("avatarFile");
  const mediaFiles = formData
    .getAll("mediaFiles")
    .filter((file): file is File => file instanceof File && file.size > 0);

  let avatarAssetId = existingAvatarAssetId || undefined;
  if (avatarFile instanceof File && avatarFile.size > 0) {
    const asset = await createMediaAssetFromUpload(
      avatarFile,
      "testimonial-avatar",
      `${timestamp}-avatar`
    );
    avatarAssetId = asset._id;
  }

  let mediaAssetIds = existingMediaAssetIds;
  if (mediaFiles.length) {
    for (const [index, file] of mediaFiles.entries()) {
      const asset = await createMediaAssetFromUpload(
        file,
        "testimonial-media",
        `${timestamp}-${index + 1}`
      );
      mediaAssetIds.push(asset._id);
    }
  }

  await fetchAdminServerJson(`/testimonials/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug,
      quote_i18n: cleanI18n({ vi: quoteVi, en: quoteEn }),
      rating: rating ?? 5,
      authorName,
      authorRole_i18n: cleanI18n({ vi: authorRoleVi, en: authorRoleEn }),
      avatarInitials: avatarInitials || undefined,
      avatarAssetId: avatarAssetId || undefined,
      mediaAssetIds: mediaAssetIds.length ? mediaAssetIds : undefined,
      source: source || "google",
      isFeatured,
      isActive,
      sortOrder: sortOrder ?? undefined,
    }),
  });

  redirect(String(formData.get("redirect") ?? "/admin/testimonials"));
}

async function deleteTestimonial(formData: FormData) {
  "use server";
  const id = readString(formData, "id");
  await fetchAdminServerJson(`/testimonials/${id}`, { method: "DELETE" });
  redirect(String(formData.get("redirect") ?? "/admin/testimonials"));
}

async function toggleTestimonialActive(formData: FormData) {
  "use server";
  const id = readString(formData, "id");
  const isActive = readBoolean(formData, "isActive");
  await fetchAdminServerJson(`/testimonials/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
  redirect(String(formData.get("redirect") ?? "/admin/testimonials"));
}

export default async function TestimonialsPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const queryParams = (await searchParams) ?? {};
  const page = Math.max(1, Number(queryParams.page ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, Number(queryParams.limit ?? "20") || 20));
  const localePrefix = getLocalePrefix(locale as "vi" | "en");
  const adminBase = `${localePrefix}/admin`;
  const redirectPath = `${adminBase}/testimonials`;

  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  const data = await fetchAdminServerJson<PaginatedResponse<Testimonial>>(
    `/testimonials/admin?${qs.toString()}`
  );
  const mediaAssets = await fetchAdminServerJson<PaginatedResponse<MediaAsset>>(
    "/media-assets/admin?page=1&limit=200"
  );
  const mediaAssetById = new Map(
    mediaAssets.items.map((asset) => [asset._id, asset])
  );
  const testimonialsWithAssets = data.items.map((item) => {
    const avatarAsset =
      item.avatarAssetId && mediaAssetById.get(item.avatarAssetId)?.url
        ? {
            id: item.avatarAssetId,
            url: mediaAssetById.get(item.avatarAssetId)?.url ?? "",
          }
        : undefined;
    const mediaAssets = (item.mediaAssetIds ?? [])
      .map((id) => {
        const url = mediaAssetById.get(id)?.url;
        return url ? { id, url } : null;
      })
      .filter(Boolean) as Array<{ id: string; url: string }>;
    return {
      ...item,
      avatarAsset,
      mediaAssets,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Content
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            Testimonials
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Highlight guest feedback and featured stories.
          </p>
        </div>
        <TestimonialsCreateSheet
          action={createTestimonial}
          redirectPath={redirectPath}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold w-[58%]">
                  Testimonial
                </th>
                <th className="px-4 py-3 text-left font-semibold w-[6%]">
                  Rating
                </th>
                <th className="px-4 py-3 text-left font-semibold w-[12%]">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold w-[10%]">
                  Updated
                </th>
                <th className="px-4 py-3 text-left font-semibold w-[14%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-muted-foreground"
                    colSpan={5}
                  >
                    No testimonials yet.
                  </td>
                </tr>
              ) : (
                testimonialsWithAssets.map((item) => (
                  <tr key={item._id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-full bg-muted/30">
                          {item.avatarAsset?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.avatarAsset.url}
                              alt={item.authorName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                              {item.avatarInitials ?? "?"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="font-medium text-foreground">
                            {item.authorName}
                          </p>
                          <p
                            className="text-xs text-muted-foreground"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {item.quote_i18n?.vi ??
                              item.quote_i18n?.en ??
                              item.quote ??
                              "-"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {item.rating ?? "-"}
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${
                            item.isFeatured
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.isFeatured ? "Featured" : "Standard"}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${
                            item.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {formatDate(item.updatedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <TestimonialsEditDialog
                          item={item}
                          action={updateTestimonial}
                          deleteAction={deleteTestimonial}
                          redirectPath={redirectPath}
                          avatarAsset={item.avatarAsset}
                          mediaAssets={item.mediaAssets}
                        />
                        <form action={toggleTestimonialActive}>
                          <input type="hidden" name="id" value={item._id} />
                          <input
                            type="hidden"
                            name="redirect"
                            value={redirectPath}
                          />
                          <input
                            type="hidden"
                            name="isActive"
                            value={item.isActive ? "false" : "true"}
                          />
                          <button
                            type="submit"
                            role="switch"
                            aria-checked={item.isActive ?? false}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
                              item.isActive
                                ? "border-emerald-200 bg-emerald-100"
                                : "border-muted-foreground/30 bg-muted"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                                item.isActive ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </form>
                        <form action={deleteTestimonial}>
                          <input type="hidden" name="id" value={item._id} />
                          <input
                            type="hidden"
                            name="redirect"
                            value={redirectPath}
                          />
                          <Button size="sm" variant="destructive">
                            Delete
                          </Button>
                        </form>
                      </div>
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

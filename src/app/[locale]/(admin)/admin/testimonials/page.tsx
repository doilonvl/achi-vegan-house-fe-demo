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
import type { PaginatedResponse, Testimonial } from "@/types/admin";

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
    mediaAssetIds = [];
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
    `/testimonials?${qs.toString()}`
  );

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
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Testimonial</th>
                <th className="px-4 py-3 text-left font-semibold">Rating</th>
                <th className="px-4 py-3 text-left font-semibold">Flags</th>
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
                    No testimonials yet.
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item._id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-medium text-foreground">
                        {item.authorName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quote_i18n?.vi ??
                          item.quote_i18n?.en ??
                          item.quote ??
                          "-"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {item.rating ?? "-"}
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      <div>Featured: {item.isFeatured ? "Yes" : "No"}</div>
                      <div>Active: {item.isActive ? "Yes" : "No"}</div>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {formatDate(item.updatedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <TestimonialsEditDialog
                        item={item}
                        action={updateTestimonial}
                        deleteAction={deleteTestimonial}
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

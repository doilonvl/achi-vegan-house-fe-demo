import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchAdminServerJson } from "@/lib/api/adminServerFetch";
import { getLocalePrefix } from "@/lib/routes";
import type { PaginatedResponse, ReservationRequest } from "@/types/admin";

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

export default async function ReservationRequestsPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const queryParams = (await searchParams) ?? {};
  const page = Math.max(1, Number(queryParams.page ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, Number(queryParams.limit ?? "20") || 20));
  const localePrefix = getLocalePrefix(locale as "vi" | "en");
  const redirectPath = `${localePrefix}/admin/reservation-requests`;

  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  const data = await fetchAdminServerJson<
    PaginatedResponse<ReservationRequest>
  >(`/reservation-requests?${qs.toString()}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Admin
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            Reservation Requests
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review incoming requests.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Guest</th>
                <th className="px-4 py-3 text-left font-semibold">Contact</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-muted-foreground"
                    colSpan={4}
                  >
                    No reservation requests yet.
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item._id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-medium text-foreground">
                        {item.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Guests: {item.guestCount}
                      </p>
                      {item.note ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.note}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <a
                        className="block text-foreground underline-offset-4 hover:underline"
                        href={`tel:${item.phoneNumber}`}
                      >
                        {item.phoneNumber}
                      </a>
                      <a
                        className="block text-muted-foreground underline-offset-4 hover:underline"
                        href={`mailto:${item.email}`}
                      >
                        {item.email}
                      </a>
                      {item.source ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Source: {item.source}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-foreground">
                        {formatDate(item.reservationDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.reservationTime}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {formatDate(item.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-semibold text-foreground">
                        {item.status}
                      </span>
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

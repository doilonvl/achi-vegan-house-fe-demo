import type { LocalizedString } from "@/types/content";

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type ReservationRequest = {
  _id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  guestCount: number;
  reservationDate: string;
  reservationTime: string;
  note?: string | null;
  source?: string | null;
  status: string;
  emailedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MediaAsset = {
  _id: string;
  slug: string;
  kind: string;
  provider?: string | null;
  url: string;
  alt_i18n?: LocalizedString;
  caption_i18n?: LocalizedString;
  alt?: string | null;
  caption?: string | null;
  tags?: string[];
  sortOrder?: number | null;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Testimonial = {
  _id: string;
  slug: string;
  quote_i18n?: LocalizedString;
  quote?: string | null;
  rating?: number | null;
  authorName: string;
  authorRole_i18n?: LocalizedString;
  authorRole?: string | null;
  avatarInitials?: string | null;
  avatarAssetId?: string | null;
  mediaAssetIds?: string[];
  source?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
  sortOrder?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type UploadItem = {
  url: string;
  publicId: string;
  bytes: number;
  resource_type: string;
  format: string;
  contentType: string;
  view_url: string;
  download_url: string;
};

import type { QueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

export type ApiErrorBody = {
  message?: string;
};

export type ApiErrorLike = AxiosError<ApiErrorBody>;

export function getApiErrorMessage(error: unknown, fallback: string) {
  const apiError = error as ApiErrorLike;
  return apiError.response?.data?.message ?? apiError.message ?? fallback;
}

export type ProfileSummary = {
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
};

export type StorefrontSummary = {
  id?: string;
  slug: string;
  name: string;
  description?: string | null;
  logo?: string | null;
  banner?: string | null;
  seller?: UserSummary;
};

export type UserSummary = {
  id: string;
  email?: string;
  role?: string;
  verificationLevel?: string;
  isActive?: boolean;
  profile?: ProfileSummary | null;
  storefront?: StorefrontSummary | null;
  _count?: {
    listings?: number;
    reviewsReceived?: number;
  };
};

export type AuthUser = UserSummary & {
  email: string;
  role: string;
  verificationLevel: string;
};

export type MediaSummary = {
  id?: string;
  url: string;
  type: string;
  order?: number;
};

export type CategoryAttributeSummary = {
  id: string;
  name: string;
  type: string;
  required: boolean;
  options?: string[];
};

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  parent?: CategorySummary | null;
  children?: CategorySummary[];
  attributes?: CategoryAttributeSummary[];
};

export type ListingAttributeValueSummary = {
  id?: string;
  attributeId: string;
  value: string;
  attribute?: CategoryAttributeSummary;
};

export type ListingSummary = {
  id: string;
  sellerId?: string;
  title: string;
  description?: string;
  categoryId?: string;
  condition: string;
  price: number | string;
  quantity: number;
  location: string;
  status: string;
  listingType?: string;
  viewCount: number;
  saveCount: number;
  isFeatured: boolean;
  rejectionReason?: string | null;
  createdAt: string;
  media: MediaSummary[];
  category: CategorySummary;
  seller?: UserSummary;
  attributeValues?: ListingAttributeValueSummary[];
  isSaved?: boolean;
  auction?: {
    id: string;
  } | null;
};

export type SavedListingSummary = {
  listing: ListingSummary | null;
};

export type AuctionBidSummary = {
  id?: string;
  amount: number | string;
  bidder?: {
    maskedName?: string;
  };
};

export type AuctionSummary = {
  id: string;
  sellerId?: string;
  currentPrice: number | string;
  startPrice: number | string;
  bidIncrement: number | string;
  startTime: string;
  endTime: string;
  status: string;
  bidCount: number;
  extended?: boolean;
  listing: ListingSummary;
  bids?: AuctionBidSummary[];
};

export type NotificationSummary = {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

export type OfferSummary = {
  id: string;
  amount: number | string;
  message?: string | null;
  status: string;
  createdAt: string;
  listing: ListingSummary;
  buyer?: UserSummary;
};

export type MessageSummary = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export type ConversationSummary = {
  id: string;
  buyerId: string;
  sellerId: string;
  buyer: UserSummary;
  seller: UserSummary;
  listing: ListingSummary;
  messages: MessageSummary[];
};

export type ReviewSummary = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  reviewer?: UserSummary;
  listing?: ListingSummary;
};

export type ReportSummary = {
  id: string;
  targetType: string;
  reason: string;
  description?: string | null;
  createdAt: string;
  reporter: UserSummary;
};

export type AdminUserSummary = UserSummary & {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
};

export type AdminStats = {
  totalUsers?: number;
  activeListings?: number;
  liveAuctions?: number;
  pendingReview?: number;
  openReports?: number;
};

export type AppQueryClient = QueryClient;

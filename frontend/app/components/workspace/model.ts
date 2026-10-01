export type Agreement = {
  id: string;
  creator_id: string;
  participant_id: string;
  title: string;
  description: string;
  status: "open" | "completed";
  accepted_at: string | null;
  date: string;
};

// Components use this stable local alias; the provider maps it to the authenticated API user.
export const CURRENT_USER = "current-user";

export type Review = {
  id: string;
  agreement_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  review_text: string;
  verification_status: "pending" | "verified" | "failed";
  blockchain_transaction: string | null;
  date: string;
};

export type Profile = {
  display_name: string;
  bio: string;
  wallet_address: string;
};

export type Person = { id: string; name: string; initials: string; role: string };
export const people: Person[] = [];

export function person(id: string): Person {
  return {
    id,
    name: `User ${id.slice(0, 8)}`,
    initials: id.slice(0, 2).toUpperCase(),
    role: "TrustLayer member",
  };
}

export function counterpart(a: Agreement, currentUserId = CURRENT_USER) {
  return person(a.creator_id === currentUserId ? a.participant_id : a.creator_id);
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

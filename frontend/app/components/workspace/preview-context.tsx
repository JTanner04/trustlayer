"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CURRENT_USER, type Agreement, type Profile, type Review } from "./model";

type State = { currentUserId: string; agreements: Agreement[]; reviews: Review[]; profile: Profile; loading: boolean; error: string | null };
type WorkspaceContext = State & {
  reload: () => Promise<void>;
  createAgreement: (input: Pick<Agreement, "title" | "description" | "participant_id">) => Promise<string>;
  acceptAgreement: (id: string) => Promise<void>;
  completeAgreement: (id: string) => Promise<void>;
  addReview: (agreementId: string, rating: number, text: string) => Promise<void>;
  saveProfile: (profile: Profile) => Promise<void>;
};
const Context = createContext<WorkspaceContext | null>(null);
const emptyProfile: Profile = { display_name: "", bio: "", wallet_address: "" };
const alias = (id: unknown, userId: string) => id === userId ? CURRENT_USER : String(id);
const toAgreement = (value: Record<string, unknown>, userId: string): Agreement => ({ ...value, creator_id: alias(value.creator_id, userId), participant_id: alias(value.participant_id, userId), status: value.status as Agreement["status"], accepted_at: value.accepted_at ? String(value.accepted_at) : null, date: String(value.created_at) }) as Agreement;
const toReview = (value: Record<string, unknown>, userId: string): Review => ({ ...value, reviewer_id: alias(value.reviewer_id, userId), reviewed_user_id: alias(value.reviewed_user_id, userId), rating: Number(value.rating), verification_status: value.verification_status as Review["verification_status"], blockchain_transaction: value.blockchain_transaction as string | null, date: String(value.created_at) }) as Review;

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/backend/${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Request failed.");
  return data as T;
}

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ currentUserId: "", agreements: [], reviews: [], profile: emptyProfile, loading: true, error: null });
  async function reload() {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [me, agreements, received, given] = await Promise.all([
        api<{ user: { id: string }; profile: Profile }>("me"),
        api<Record<string, unknown>[]>("agreements"),
        api<Record<string, unknown>[]>("reviews?scope=received"),
        api<Record<string, unknown>[]>("reviews?scope=given"),
      ]);
      const reviews = [...received, ...given].map((review) => toReview(review, me.user.id)).filter((review, index, all) => all.findIndex((other) => other.id === review.id) === index);
      setState({ currentUserId: me.user.id, profile: { ...me.profile, wallet_address: me.profile.wallet_address ?? "" }, agreements: agreements.map((agreement) => toAgreement(agreement, me.user.id)), reviews, loading: false, error: null });
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error: error instanceof Error ? error.message : "Could not load your workspace." }));
    }
  }
  useEffect(() => { void reload(); }, []);
  async function createAgreement(input: Pick<Agreement, "title" | "description" | "participant_id">) {
    const agreement = await api<Record<string, unknown>>("agreements", { method: "POST", body: JSON.stringify(input) });
    const mapped = toAgreement(agreement, state.currentUserId); setState((s) => ({ ...s, agreements: [mapped, ...s.agreements] })); return mapped.id;
  }
  async function acceptAgreement(id: string) {
    const agreement = await api<Record<string, unknown>>(`agreements/${id}/accept`, { method: "POST" });
    const mapped = toAgreement(agreement, state.currentUserId); setState((s) => ({ ...s, agreements: s.agreements.map((item) => item.id === id ? mapped : item) }));
  }
  async function completeAgreement(id: string) {
    const agreement = await api<Record<string, unknown>>(`agreements/${id}/complete`, { method: "POST" });
    const mapped = toAgreement(agreement, state.currentUserId); setState((s) => ({ ...s, agreements: s.agreements.map((item) => item.id === id ? mapped : item) }));
  }
  async function addReview(agreementId: string, rating: number, review_text: string) {
    const review = await api<Record<string, unknown>>("reviews", { method: "POST", body: JSON.stringify({ agreement_id: agreementId, rating, review_text }) });
    setState((s) => ({ ...s, reviews: [toReview(review, state.currentUserId), ...s.reviews] }));
  }
  async function saveProfile(profile: Profile) {
    const saved = await api<Profile>(`profiles/${state.currentUserId}`, { method: "PUT", body: JSON.stringify({ ...profile, wallet_address: profile.wallet_address || null }) });
    setState((s) => ({ ...s, profile: { ...saved, wallet_address: saved.wallet_address ?? "" } }));
  }
  return <Context.Provider value={{ ...state, reload, createAgreement, acceptAgreement, completeAgreement, addReview, saveProfile }}>{children}</Context.Provider>;
}
export function usePreview() { const value = useContext(Context); if (!value) throw new Error("Workspace provider is required"); return value; }

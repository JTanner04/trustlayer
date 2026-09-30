"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  CURRENT_USER,
  initialAgreements,
  initialProfile,
  initialReviews,
  type Agreement,
  type Review,
  type Profile,
} from "./model";

type PreviewState = {
  agreements: Agreement[];
  reviews: Review[];
  profile: Profile;
};
type PreviewContext = PreviewState & {
  createAgreement: (
    input: Pick<Agreement, "title" | "description" | "participant_id">,
  ) => string;
  completeAgreement: (id: string) => void;
  addReview: (agreementId: string, rating: number, text: string) => void;
  saveProfile: (profile: Profile) => void;
};
const Context = createContext<PreviewContext | null>(null);
const today = () => new Date().toISOString().slice(0, 10);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PreviewState>({
    agreements: initialAgreements,
    reviews: initialReviews,
    profile: initialProfile,
  });
  function createAgreement(
    input: Pick<Agreement, "title" | "description" | "participant_id">,
  ) {
    const id = crypto.randomUUID();
    setState((s) => ({
      ...s,
      agreements: [
        {
          ...input,
          id,
          title: input.title.trim(),
          description: input.description.trim(),
          creator_id: CURRENT_USER,
          status: "open",
          date: today(),
        },
        ...s.agreements,
      ],
    }));
    return id;
  }
  function completeAgreement(id: string) {
    setState((s) => ({
      ...s,
      agreements: s.agreements.map((a) =>
        a.id === id &&
        (a.creator_id === CURRENT_USER || a.participant_id === CURRENT_USER)
          ? { ...a, status: "completed" }
          : a,
      ),
    }));
  }
  function addReview(agreementId: string, rating: number, text: string) {
    const id = crypto.randomUUID();
    setState((s) => {
      const a = s.agreements.find((a) => a.id === agreementId);
      if (
        !a ||
        a.status !== "completed" ||
        ![a.creator_id, a.participant_id].includes(CURRENT_USER) ||
        s.reviews.some(
          (r) =>
            r.agreement_id === agreementId && r.reviewer_id === CURRENT_USER,
        ) ||
        rating < 1 ||
        rating > 5 ||
        !text.trim()
      )
        return s;
      const review: Review = {
        id,
        agreement_id: agreementId,
        reviewer_id: CURRENT_USER,
        reviewed_user_id:
          a.creator_id === CURRENT_USER ? a.participant_id : a.creator_id,
        rating,
        review_text: text.trim(),
        verification_status: "pending",
        blockchain_transaction: null,
        date: today(),
      };
      return { ...s, reviews: [review, ...s.reviews] };
    });
  }
  return (
    <Context.Provider
      value={{
        ...state,
        createAgreement,
        completeAgreement,
        addReview,
        saveProfile: (profile) => setState((s) => ({ ...s, profile })),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function usePreview() {
  const value = useContext(Context);
  if (!value) throw new Error("PreviewProvider is required");
  return value;
}

// Presentation fixtures only. These mirror the API fields without making API calls.
export const CURRENT_USER = "11111111-1111-4111-8111-111111111111";
export type Person = {
  id: string;
  name: string;
  initials: string;
  role: string;
};
export type Agreement = {
  id: string;
  creator_id: string;
  participant_id: string;
  title: string;
  description: string;
  status: "open" | "completed";
  date: string;
};
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
export const people: Person[] = [
  {
    id: CURRENT_USER,
    name: "Marcus Chen",
    initials: "MC",
    role: "Independent developer",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Sarah Mitchell",
    initials: "SM",
    role: "Small business owner",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Alex Rivera",
    initials: "AR",
    role: "Product designer",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Jordan Lee",
    initials: "JL",
    role: "Founder, Common Ground",
  },
];
export const initialProfile: Profile = {
  display_name: "Marcus Chen",
  bio: "Independent developer building thoughtful web experiences for small businesses. I care about clear communication, accessible interfaces, and getting the details right.",
  wallet_address: "",
};
export const initialAgreements: Agreement[] = [
  {
    id: "storefront",
    creator_id: people[1].id,
    participant_id: CURRENT_USER,
    title: "Online storefront redesign",
    description:
      "Redesign the storefront homepage and product pages for Sarah’s small business. Deliver a responsive layout, an accessible product navigation, and a handoff walkthrough.",
    status: "open",
    date: "2026-09-28",
  },
  {
    id: "design-system",
    creator_id: CURRENT_USER,
    participant_id: people[2].id,
    title: "Design system implementation",
    description:
      "Build a reusable component library from the approved designs, including buttons, inputs, cards, and a responsive navigation. Include usage examples for the team.",
    status: "completed",
    date: "2026-09-24",
  },
  {
    id: "landing-page",
    creator_id: people[3].id,
    participant_id: CURRENT_USER,
    title: "Common Ground landing page",
    description:
      "Develop a responsive landing page with a project overview, services section, and contact information. Review the final implementation together before handoff.",
    status: "completed",
    date: "2026-09-18",
  },
  {
    id: "accessibility",
    creator_id: people[1].id,
    participant_id: CURRENT_USER,
    title: "Website accessibility improvements",
    description:
      "Improve keyboard navigation, form labels, and color contrast across the existing website. Document the changes and any remaining recommendations.",
    status: "completed",
    date: "2026-09-12",
  },
  {
    id: "portfolio",
    creator_id: people[2].id,
    participant_id: CURRENT_USER,
    title: "Portfolio website refresh",
    description:
      "Refresh the project gallery and case study layouts, with mobile-friendly typography and optimized image presentation.",
    status: "open",
    date: "2026-09-26",
  },
];
export const initialReviews: Review[] = [
  {
    id: "review-alex",
    agreement_id: "design-system",
    reviewer_id: people[2].id,
    reviewed_user_id: CURRENT_USER,
    rating: 5,
    review_text:
      "Marcus translated the designs into a really thoughtful component library. Clear communication throughout, and the handoff made it easy for our team to keep building.",
    verification_status: "pending",
    blockchain_transaction: null,
    date: "2026-09-25",
  },
  {
    id: "review-jordan",
    agreement_id: "landing-page",
    reviewer_id: people[3].id,
    reviewed_user_id: CURRENT_USER,
    rating: 5,
    review_text:
      "The site feels exactly like our brand. Marcus was reliable, asked the right questions, and delivered everything we agreed on.",
    verification_status: "verified",
    blockchain_transaction: "SAMPLE-TRANSACTION-NOT-ON-CHAIN",
    date: "2026-09-19",
  },
  {
    id: "review-sarah",
    agreement_id: "accessibility",
    reviewer_id: people[1].id,
    reviewed_user_id: CURRENT_USER,
    rating: 4,
    review_text:
      "A careful review of our website and practical improvements that made a real difference. The documentation was especially helpful.",
    verification_status: "failed",
    blockchain_transaction: null,
    date: "2026-09-13",
  },
  {
    id: "review-given",
    agreement_id: "landing-page",
    reviewer_id: CURRENT_USER,
    reviewed_user_id: people[3].id,
    rating: 5,
    review_text:
      "Jordan provided clear goals and timely feedback. A smooth collaboration from the first conversation to the final handoff.",
    verification_status: "verified",
    blockchain_transaction: "SAMPLE-TRANSACTION-NOT-ON-CHAIN",
    date: "2026-09-20",
  },
];
export function person(id: string): Person {
  return (
    people.find((p) => p.id === id) ?? {
      id,
      name: "New participant",
      initials: "NP",
      role: "Invited by user ID",
    }
  );
}
export function counterpart(a: Agreement) {
  return person(
    a.creator_id === CURRENT_USER ? a.participant_id : a.creator_id,
  );
}
export function formatDate(date: string) {
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

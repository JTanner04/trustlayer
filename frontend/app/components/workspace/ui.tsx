import Link from "next/link";
import type { ReactNode } from "react";
import {
  counterpart,
  formatDate,
  person,
  type Agreement,
  type Review,
} from "./model";
import s from "./workspace.module.css";

export type IconName =
  | "layers"
  | "grid"
  | "file"
  | "star"
  | "person"
  | "settings"
  | "arrow"
  | "plus"
  | "check"
  | "shield"
  | "back"
  | "search"
  | "clock"
  | "wallet"
  | "external";
export function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    file: (
      <>
        <path d="M14 3H5v18h14V8l-5-5Z" />
        <path d="M14 3v5h5M8 12h8M8 16h5" />
      </>
    ),
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    ),
    person: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    settings: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
        <circle cx="8" cy="6" r="2" fill="currentColor" />
        <circle cx="16" cy="12" r="2" fill="currentColor" />
        <circle cx="10" cy="18" r="2" fill="currentColor" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    back: <path d="M20 12H4m6-6-6 6 6 6" />,
    plus: <path d="M12 4v16M4 12h16" />,
    check: <path d="m5 12 4 4L19 6" />,
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    search: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 6 6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v6l4 2" />
      </>
    ),
    wallet: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="2" />
        <path d="M3 8V4l14-2v3M16 11h5v5h-5z" />
      </>
    ),
    external: (
      <>
        <path d="M14 3h7v7m0-7L10 14M10 3H4v17h17v-6" />
      </>
    ),
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
export function Badge({ status }: { status: string }) {
  return (
    <span className={`${s.badge} ${s[status] ?? ""}`}>
      <span />
      {status === "failed"
        ? "Verification failed"
        : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
export function Avatar({
  name,
  large = false,
}: {
  name: string;
  large?: boolean;
}) {
  return (
    <span
      className={`${s.avatar} ${large ? s.avatarLarge : ""}`}
      aria-hidden="true"
    >
      {name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
export function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={s.heading}>
      <div>
        <p className={s.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p className={s.muted}>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={s.empty}>
      <Icon name="layers" />
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}
export function Stars({ rating }: { rating: number }) {
  return (
    <span className={s.stars} aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span>{"★".repeat(5 - rating)}</span>
    </span>
  );
}
export function AgreementTable({ agreements }: { agreements: Agreement[] }) {
  return (
    <div className={s.tableScroll}>
      <table className={s.table}>
        <thead>
          <tr>
            <th scope="col">Agreement</th>
            <th scope="col">Working with</th>
            <th scope="col">Status</th>
            <th scope="col">Created</th>
          </tr>
        </thead>
        <tbody>
          {agreements.map((a) => (
            <tr key={a.id}>
              <td>
                <Link className={s.tableTitle} href={`/agreements/${a.id}`}>
                  <span className={s.fileIcon}>
                    <Icon name="file" />
                  </span>
                  {a.title}
                </Link>
              </td>
              <td>
                <span className={s.personCell}>
                  <Avatar name={counterpart(a).name} />
                  {counterpart(a).name}
                </span>
              </td>
              <td>
                <Badge status={a.status} />
              </td>
              <td className={s.date}>{formatDate(a.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function ReviewCard({
  review,
  agreement,
  given = false,
}: {
  review: Review;
  agreement?: Agreement;
  given?: boolean;
}) {
  const author = person(given ? review.reviewed_user_id : review.reviewer_id);
  return (
    <article className={s.reviewCard}>
      <div className={s.cardHeader}>
        <div className={s.personCell}>
          <Avatar name={author.name} />
          <div>
            <strong>{given ? `To ${author.name}` : author.name}</strong>
            <small>{formatDate(review.date)}</small>
          </div>
        </div>
        <Stars rating={review.rating} />
      </div>
      <p className={s.reviewText}>{review.review_text}</p>
      <div className={s.reviewAgreement}>
        <Icon name="file" />
        <Link href={`/agreements/${review.agreement_id}`}>
          {agreement?.title ?? "Completed agreement"}
        </Link>
      </div>
      <div className={s.reviewFooter}>
        <Badge status={review.verification_status} />
        <Link
          className={s.textLink}
          href={`/reviews/${review.id}/verification`}
        >
          View record
          <Icon name="arrow" />
        </Link>
      </div>
    </article>
  );
}

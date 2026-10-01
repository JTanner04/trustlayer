"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { usePreview } from "./preview-context";
import { CURRENT_USER, counterpart, formatDate, person } from "./model";
import { Avatar, Badge, Empty, Heading, Icon, ReviewCard, Stars } from "./ui";
import s from "./workspace.module.css";

export function Reviews() {
  const { reviews, agreements } = usePreview();
  const [tab, setTab] = useState("received");
  const [status, setStatus] = useState("all");
  const ready = agreements.filter(
    (a) =>
      a.status === "completed" &&
      !reviews.some(
        (r) => r.agreement_id === a.id && r.reviewer_id === CURRENT_USER,
      ),
  );
  const received = reviews.filter((r) => r.reviewed_user_id === CURRENT_USER);
  const given = reviews.filter((r) => r.reviewer_id === CURRENT_USER);
  const list = (tab === "received" ? received : given).filter(
    (r) => status === "all" || r.verification_status === status,
  );
  return (
    <>
      <Heading
        eyebrow="EVERY REVIEW HAS A HISTORY"
        title="Reviews"
        description="Feedback from completed work, with the record behind every interaction."
      />
      <div className={s.toolbar}>
        <div className={s.tabs} aria-label="Review category">
          {[
            { key: "received", label: "Received", count: received.length },
            { key: "given", label: "Given", count: given.length },
            { key: "ready", label: "To write", count: ready.length },
          ].map((t) => (
            <button
              key={t.key}
              className={tab === t.key ? s.selectedTab : ""}
              aria-pressed={tab === t.key}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <span>{t.count}</span>
            </button>
          ))}
        </div>
        {tab !== "ready" && (
          <label className={s.filter}>
            Verification
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </label>
        )}
      </div>
      {tab === "ready" ? (
        <div className={s.reviewGrid}>
          {ready.length ? (
            ready.map((a) => (
              <article className={`${s.panel} ${s.padded}`} key={a.id}>
                <div className={s.cardHeader}>
                  <Avatar name={counterpart(a).name} />
                  <Badge status="completed" />
                </div>
                <h2>{a.title}</h2>
                <p className={s.longText}>
                  How was your experience working with {counterpart(a).name}?
                </p>
                <Link className={s.primary} href={`/agreements/${a.id}/review`}>
                  Write a review
                  <Icon name="arrow" />
                </Link>
              </article>
            ))
          ) : (
            <Empty title="You’re all caught up">
              <p>Complete another agreement to leave a review.</p>
              <Link href="/agreements" className={s.secondary}>
                View agreements
              </Link>
            </Empty>
          )}
        </div>
      ) : list.length ? (
        <div className={s.reviewGrid}>
          {list.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              agreement={agreements.find((a) => a.id === r.agreement_id)}
              given={tab === "given"}
            />
          ))}
        </div>
      ) : (
        <Empty title="No reviews here yet">
          <p>
            Reviews matching this category and verification status will appear
            here.
          </p>
          <button className={s.secondary} onClick={() => setStatus("all")}>
            Show all statuses
          </button>
        </Empty>
      )}
    </>
  );
}

export function WriteReview() {
  const { id } = useParams<{ id: string }>();
  const { agreements, reviews, addReview } = usePreview();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [error, setError] = useState("");
  const a = agreements.find((a) => a.id === id);
  const existing = reviews.find(
    (r) => r.agreement_id === id && r.reviewer_id === CURRENT_USER,
  );
  if (!a)
    return (
      <Empty title="Agreement not found">
        <Link className={s.secondary} href="/agreements">
          View agreements
        </Link>
      </Empty>
    );
  if (a.status !== "completed" || existing)
    return (
      <Empty
        title={
          existing
            ? "You’ve already reviewed this agreement"
            : "Complete the agreement first"
        }
      >
        <p>
          {existing
            ? "Each participant can submit one review."
            : "Reviews are available only after the work is complete."}
        </p>
        <Link className={s.primary} href={`/agreements/${id}`}>
          Back to agreement
        </Link>
      </Empty>
    );
  const agreement = a;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = String(
      new FormData(e.currentTarget).get("review") ?? "",
    ).trim();
    if (!rating || !text)
      return setError("Choose a rating and describe your experience.");
    try {
      await addReview(agreement.id, rating, text);
      router.push(`/agreements/${agreement.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not submit review.");
    }
  }
  return (
    <>
      <Link className={s.back} href={`/agreements/${id}`}>
        <Icon name="back" />
        Back to agreement
      </Link>
      <Heading
        eyebrow="FEEDBACK THAT MEANS SOMETHING"
        title="Share your experience"
        description="Your review will be linked to the completed agreement."
      />
      <div className={s.formGrid}>
        <form className={`${s.panel} ${s.form}`} onSubmit={submit}>
          <div className={s.reviewSubject}>
            <Avatar name={counterpart(a).name} large />
            <div>
              <p className={s.smallLabel}>REVIEWING</p>
              <h2>{counterpart(a).name}</h2>
              <p>{a.title}</p>
            </div>
          </div>
          <fieldset className={s.ratingField}>
            <legend>How was the collaboration?</legend>
            <div className={s.ratingChoices}>
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n}>
                  <input
                    type="radio"
                    name="rating"
                    value={n}
                    checked={rating === n}
                    onChange={() => setRating(n)}
                    required
                  />
                  <span
                    className={n <= rating ? s.litStar : ""}
                    aria-hidden="true"
                  >
                    ★
                  </span>
                  <span className={s.srOnly}>
                    {n} {n === 1 ? "star" : "stars"}
                  </span>
                </label>
              ))}
            </div>
            <p>
              {rating
                ? `${rating} out of 5 stars`
                : "Select a rating from 1 to 5"}
            </p>
          </fieldset>
          <label className={s.field}>
            Your review
            <textarea
              name="review"
              required
              rows={6}
              placeholder="What went well? What could have been better? Share details about the work and collaboration."
            />
          </label>
          <p className={s.muted}>
            This feedback will appear on the other participant’s public profile.
          </p>
          {error && (
            <p className={s.error} role="alert">
              {error}
            </p>
          )}
          <div className={s.formActions}>
            <Link className={s.secondary} href={`/agreements/${id}`}>
              Cancel
            </Link>
            <button className={s.primary}>
              Submit review
              <Icon name="arrow" />
            </button>
          </div>
        </form>
        <aside className={s.helpCard}>
          <Icon name="star" />
          <h2>Helpful feedback is specific.</h2>
          <p>
            Talk about the work, communication, and whether the agreed outcome
            was met.
          </p>
          <div className={s.divider} />
          <h3>What happens next?</h3>
          <p>
            Your review starts with a pending verification status. In the full
            application, a Solana record will make the interaction independently
            verifiable.
          </p>
          <p className={s.footnote}>
            Reviews begin pending verification. No blockchain transaction is sent yet.
          </p>
        </aside>
      </div>
    </>
  );
}

export function Verification() {
  const { id } = useParams<{ id: string }>();
  const { reviews, agreements } = usePreview();
  const r = reviews.find((r) => r.id === id);
  if (!r)
    return (
      <Empty title="Review record not found">
        <p>This review could not be found in your account.</p>
        <Link className={s.secondary} href="/reviews">
          Back to reviews
        </Link>
      </Empty>
    );
  const a = agreements.find((a) => a.id === r.agreement_id);
  const descriptions = {
    verified:
      "A confirmed Solana Devnet transaction records a digest that links this review to its completed agreement.",
    pending:
      "The review is saved, but its verification transaction has not been confirmed yet.",
    failed:
      "The review remains visible, but its Solana verification transaction could not be completed.",
  };
  return (
    <>
      <Link className={s.back} href="/reviews">
        <Icon name="back" />
        All reviews
      </Link>
      <Heading
        eyebrow="THE RECORD BEHIND THE REVIEW"
        title="Review verification"
        description="See how this review connects to a completed interaction."
      />
      <div className={s.detailGrid}>
        <div className={s.stack}>
          <section className={`${s.panel} ${s.padded}`}>
            <div className={s.cardHeader}>
              <span className={s.softIcon}>
                <Icon name="shield" />
              </span>
              <Badge status={r.verification_status} />
            </div>
            <h2>
              {r.verification_status === "verified"
                ? "A traceable interaction."
                : r.verification_status === "pending"
                  ? "Verification is pending."
                  : "Verification needs attention."}
            </h2>
            <p className={s.longText}>{descriptions[r.verification_status]}</p>
            <ol className={s.timeline}>
              <li className={s.done}>
                <Icon name="check" />
                <div>
                  <strong>Completed agreement</strong>
                  <p>
                    <Link href={`/agreements/${r.agreement_id}`}>
                      {a?.title}
                    </Link>
                  </p>
                </div>
              </li>
              <li className={s.done}>
                <Icon name="check" />
                <div>
                  <strong>Review by a participant</strong>
                  <p>
                    {person(r.reviewer_id).name} · {formatDate(r.date)}
                  </p>
                </div>
              </li>
              <li
                className={r.verification_status === "verified" ? s.done : ""}
              >
                <Icon name="shield" />
                <div>
                  <strong>Solana verification record</strong>
                  <p>
                    {r.verification_status === "verified"
                      ? "Confirmed Devnet transaction recorded."
                      : "No confirmed transaction available."}
                  </p>
                </div>
              </li>
            </ol>
          </section>
          <section className={`${s.panel} ${s.padded}`}>
            <h2>Review details</h2>
            <div className={s.reviewSubject}>
              <Avatar name={person(r.reviewer_id).name} />
              <div>
                <strong>{person(r.reviewer_id).name}</strong>
                <p>Reviewing {person(r.reviewed_user_id).name}</p>
              </div>
              <Stars rating={r.rating} />
            </div>
            <p className={s.reviewText}>{r.review_text}</p>
          </section>
        </div>
        <aside className={`${s.panel} ${s.padded}`}>
          <h2>Record information</h2>
          <dl className={s.recordInfo}>
            <div>
              <dt>Review ID</dt>
              <dd>
                <code>{r.id}</code>
              </dd>
            </div>
            <div>
              <dt>Agreement ID</dt>
              <dd>
                <Link href={`/agreements/${r.agreement_id}`}>
                  {r.agreement_id}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Verification network</dt>
              <dd>Solana Devnet</dd>
            </div>
            <div>
              <dt>Transaction</dt>
              <dd>
                {r.blockchain_transaction ? (
                  <a
                    href={`https://explorer.solana.com/tx/${r.blockchain_transaction}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View transaction in Solana Explorer
                  </a>
                ) : "Not recorded"}
              </dd>
            </div>
          </dl>
          <div className={s.quietNote}>
            <Icon name="shield" />
            <p>
              Verification confirms the review’s record and origin. It does not
              guarantee the reviewer’s opinion or the quality of the work.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

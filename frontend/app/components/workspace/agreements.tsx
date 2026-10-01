"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { usePreview } from "./preview-context";
import { CURRENT_USER, counterpart, formatDate, person } from "./model";
import {
  AgreementTable,
  Avatar,
  Badge,
  Empty,
  Heading,
  Icon,
  ReviewCard,
} from "./ui";
import s from "./workspace.module.css";

export function Agreements() {
  const { agreements } = usePreview();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const filtered = agreements.filter(
    (a) =>
      (filter === "all" || a.status === filter) &&
      `${a.title} ${counterpart(a).name}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <Heading
        eyebrow="SHARED WORK, CLEAR EXPECTATIONS"
        title="Agreements"
        description="Keep track of the work you’re doing and the people you’re doing it with."
        action={
          <Link href="/agreements/new" className={s.primary}>
            <Icon name="plus" />
            New agreement
          </Link>
        }
      />
      <section className={s.panel}>
        <div className={s.toolbar}>
          <div className={s.tabs} aria-label="Filter agreements">
            {["all", "open", "completed"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={f === filter}
                className={f === filter ? s.selectedTab : ""}
              >
                {f === "all"
                  ? "All agreements"
                  : f.charAt(0).toUpperCase() + f.slice(1)}
                <span>
                  {
                    agreements.filter((a) => f === "all" || a.status === f)
                      .length
                  }
                </span>
              </button>
            ))}
          </div>
          <label className={s.search}>
            <Icon name="search" />
            <span className={s.srOnly}>Search agreements</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search agreements…"
            />
          </label>
        </div>
        {filtered.length ? (
          <AgreementTable agreements={filtered} />
        ) : (
          <Empty title="No agreements found">
            <p>Try a different search or filter.</p>
            <button
              className={s.secondary}
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
            >
              Clear filters
            </button>
          </Empty>
        )}
      </section>
      <p className={s.footnote}>
        <Icon name="shield" />
        Only participants can complete an agreement. Reviews become available
        after completion.
      </p>
    </>
  );
}

export function NewAgreement() {
  const { createAgreement, currentUserId } = usePreview();
  const router = useRouter();
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const title = String(data.get("title") ?? "").trim();
    const participant_id = String(data.get("participant") ?? "").trim();
    if (!title) return setError("Add a title for this agreement.");
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        participant_id,
      ) ||
      participant_id === currentUserId
    )
      return setError("Enter another participant’s valid user ID.");
    try {
      const id = await createAgreement({ title, participant_id, description: String(data.get("description") ?? "") });
      router.push(`/agreements/${id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create agreement.");
    }
  }
  return (
    <>
      <Link className={s.back} href="/agreements">
        <Icon name="back" />
        All agreements
      </Link>
      <Heading
        eyebrow="START WITH A SHARED UNDERSTANDING"
        title="Create an agreement"
        description="Define the work and who you’ll be working with."
      />
      <div className={s.formGrid}>
        <form className={`${s.panel} ${s.form}`} onSubmit={submit}>
          <div className={s.formSection}>
            <h2>The basics</h2>
            <p>Make it easy for both people to understand the work.</p>
          </div>
          <label className={s.field}>
            Agreement title
            <input
              name="title"
              required
              maxLength={160}
              placeholder="e.g. Online storefront redesign"
            />
          </label>
          <label className={s.field}>
            Participant user ID
            <input
              name="participant"
              required
              placeholder="Paste another TrustLayer user’s ID"
              aria-describedby="participant-help"
            />
            <span id="participant-help">
              Ask your collaborator for the user ID shown in their profile settings.
            </span>
          </label>
          <label className={s.field}>
            Description <span className={s.optional}>Optional</span>
            <textarea
              name="description"
              rows={5}
              placeholder="Describe the scope, deliverables, and what completed work looks like."
            />
          </label>
          {error && (
            <p role="alert" className={s.error}>
              {error}
            </p>
          )}
          <div className={s.formActions}>
            <Link className={s.secondary} href="/agreements">
              Cancel
            </Link>
            <button className={s.primary} type="submit">
              Create agreement
              <Icon name="arrow" />
            </button>
          </div>
        </form>
        <aside className={s.helpCard}>
          <Icon name="file" />
          <h2>A clear start makes a better finish.</h2>
          <p>
            A useful agreement describes the work, the expected outcome, and who
            is involved.
          </p>
          <ol>
            <li>Create the agreement with another person.</li>
            <li>Either participant can mark it complete.</li>
            <li>Each person can then leave one review.</li>
          </ol>
          <p className={s.footnote}>
            The invited participant must accept before either person can mark this complete.
          </p>
        </aside>
      </div>
    </>
  );
}

export function AgreementDetail() {
  const { id } = useParams<{ id: string }>();
  const { agreements, reviews, acceptAgreement, completeAgreement } = usePreview();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const a = agreements.find((a) => a.id === id);
  if (!a)
    return (
      <Empty title="Agreement not found">
        <p>Temporary agreements reset when you refresh the page.</p>
        <Link className={s.primary} href="/agreements">
          Back to agreements
        </Link>
      </Empty>
    );
  const myReview = reviews.find(
    (r) => r.agreement_id === id && r.reviewer_id === CURRENT_USER,
  );
  const agreementReviews = reviews.filter((r) => r.agreement_id === id);
  const other = counterpart(a);
  const awaitingMyAcceptance = a.status === "open" && !a.accepted_at && a.participant_id === CURRENT_USER;
  const awaitingOtherAcceptance = a.status === "open" && !a.accepted_at && a.creator_id === CURRENT_USER;
  async function accept() {
    setSaving(true); setError("");
    try { await acceptAgreement(id); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not accept this agreement."); }
    finally { setSaving(false); }
  }
  async function complete() {
    setSaving(true); setError("");
    try { await completeAgreement(id); setConfirm(false); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not complete this agreement."); }
    finally { setSaving(false); }
  }
  return (
    <>
      <Link className={s.back} href="/agreements">
        <Icon name="back" />
        All agreements
      </Link>
      <Heading
        eyebrow="AGREEMENT DETAILS"
        title={a.title}
        description={`Created ${formatDate(a.date)} · ${a.creator_id === CURRENT_USER ? "Created by you" : `Created by ${person(a.creator_id).name}`}`}
        action={<Badge status={a.status} />}
      />
      <div className={s.detailGrid}>
        <div className={s.stack}>
          <section className={`${s.panel} ${s.padded}`}>
            <p className={s.eyebrow}>THE WORK</p>
            <h2>Scope & description</h2>
            <p className={s.longText}>
              {a.description || "No description provided."}
            </p>
            <div className={s.participants}>
              <div>
                <span className={s.smallLabel}>YOU</span>
                <div className={s.personCell}>
                  <Avatar name="You" />
                  <span>
                    Your account<small>Participant</small>
                  </span>
                </div>
              </div>
              <div>
                <span className={s.smallLabel}>WORKING WITH</span>
                <div className={s.personCell}>
                  <Avatar name={other.name} />
                  <span>
                    {other.name}
                    <small>{other.role}</small>
                  </span>
                </div>
              </div>
            </div>
          </section>
          <section className={`${s.panel} ${s.padded}`}>
            <h2>
              {awaitingMyAcceptance
                ? "Review and accept this agreement"
                : awaitingOtherAcceptance
                  ? "Waiting for acceptance"
                : a.status === "open"
                ? "Ready to call it complete?"
                : myReview
                  ? "Your review is on the record."
                  : "The work is complete. Share your experience."}
            </h2>
            <p className={s.longText}>
              {awaitingMyAcceptance
                ? "You were invited to this agreement. Accept it before either participant can mark the work complete."
                : awaitingOtherAcceptance
                  ? "The invited participant must accept this agreement before either of you can mark the work complete."
                : a.status === "open"
                ? "Mark this agreement complete once the work is done. This makes it eligible for a review from each participant."
                : myReview
                  ? "You’ve already reviewed this agreement. Each participant can submit one review."
                  : `Leave a review for ${other.name}. Your feedback will be linked to this completed agreement.`}
            </p>
            {awaitingMyAcceptance ? (
              <button className={s.primary} onClick={() => void accept()} disabled={saving}>
                <Icon name="check" />
                {saving ? "Accepting…" : "Accept agreement"}
              </button>
            ) : awaitingOtherAcceptance ? (
              <p className={s.footnote}>Share this agreement with the invited participant so they can sign in and accept it.</p>
            ) : a.status === "open" ? (
              confirm ? (
                <div className={s.confirmation}>
                  <strong>Mark this agreement complete?</strong>
                  <p>You won’t be able to reopen it after confirming.</p>
                  <div className={s.inlineActions}>
                    <button
                      className={s.primary}
                      onClick={() => void complete()}
                      disabled={saving}
                    >
                      {saving ? "Completing…" : "Confirm completion"}
                    </button>
                    <button
                      className={s.secondary}
                      onClick={() => setConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button className={s.primary} onClick={() => setConfirm(true)}>
                  <Icon name="check" />
                  Mark complete
                </button>
              )
            ) : (
              <Link
                className={myReview ? s.secondary : s.primary}
                href={
                  myReview
                    ? `/reviews/${myReview.id}/verification`
                    : `/agreements/${id}/review`
                }
              >
                {myReview ? "View your review record" : "Write a review"}
                <Icon name="arrow" />
              </Link>
            )}
            {error && <p role="alert" className={s.error}>{error}</p>}
          </section>
          {agreementReviews.length > 0 && (
            <section>
              <div className={s.sectionTitle}>
                <h2>Reviews for this agreement</h2>
              </div>
              <div className={s.stack}>
                {agreementReviews.map((r) => (
                  <ReviewCard
                    key={r.id}
                    review={r}
                    agreement={a}
                    given={r.reviewer_id === CURRENT_USER}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className={`${s.panel} ${s.padded}`}>
          <h2>Agreement progress</h2>
          <ol className={s.timeline}>
            <li className={s.done}>
              <Icon name="check" />
              <div>
                <strong>Agreement created</strong>
                <p>Both participants are on the record.</p>
              </div>
            </li>
            <li className={a.status === "completed" ? s.done : ""}>
              <Icon name={a.status === "completed" ? "check" : "clock"} />
              <div>
                <strong>
                  {a.status === "completed"
                    ? "Work completed"
                    : "Work in progress"}
                </strong>
                <p>
                  {a.status === "completed"
                    ? "Reviews are now available."
                    : "Mark complete when the work is done."}
                </p>
              </div>
            </li>
            <li className={myReview ? s.done : ""}>
              <Icon name={myReview ? "check" : "star"} />
              <div>
                <strong>
                  {myReview ? "Your review submitted" : "Leave your review"}
                </strong>
                <p>One review per participant.</p>
              </div>
            </li>
          </ol>
          <div className={s.divider} />
          <p className={s.smallLabel}>AGREEMENT ID</p>
          <code className={s.code}>{a.id}</code>
        </aside>
      </div>
    </>
  );
}

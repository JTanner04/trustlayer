"use client";
import Link from "next/link";
import { usePreview } from "./preview-context";
import { CURRENT_USER, counterpart } from "./model";
import { AgreementTable, Avatar, Heading, Icon, ReviewCard } from "./ui";
import s from "./workspace.module.css";
export default function Overview() {
  const { profile, agreements, reviews } = usePreview();
  const received = reviews.filter((r) => r.reviewed_user_id === CURRENT_USER);
  const completed = agreements.filter((a) => a.status === "completed");
  const ready = completed.filter(
    (a) =>
      !reviews.some(
        (r) => r.agreement_id === a.id && r.reviewer_id === CURRENT_USER,
      ),
  );
  const verified = received.filter(
    (r) => r.verification_status === "verified",
  ).length;
  const open = agreements.length - completed.length;
  const stats = [
    {
      label: "Open agreements",
      value: open,
      note: "Work in progress",
      icon: "file",
    },
    {
      label: "Completed agreements",
      value: completed.length,
      note: "Interactions on your record",
      icon: "check",
    },
    {
      label: "Reviews received",
      value: received.length,
      note: `${ready.length} reviews you can leave`,
      icon: "star",
    },
    {
      label: "Verified reviews",
      value: verified,
      note: "Of your received reviews",
      icon: "shield",
    },
  ] as const;
  return (
    <>
      <Heading
        eyebrow="YOUR REPUTATION, IN PROGRESS"
        title={`Welcome back, ${profile.display_name.split(" ")[0]}.`}
        description="A little progress today. A stronger reputation tomorrow."
        action={
          <Link className={s.primary} href="/agreements/new">
            <Icon name="plus" />
            New agreement
          </Link>
        }
      />
      <div className={s.stats}>
        {stats.map((stat) => (
          <section className={s.stat} key={stat.label}>
            <div>
              <span>{stat.label}</span>
              <Icon name={stat.icon} />
            </div>
            <strong>{stat.value.toString().padStart(2, "0")}</strong>
            <p>{stat.note}</p>
          </section>
        ))}
      </div>
      <div className={s.dashboardGrid}>
        <div className={s.stack}>
          <section className={s.panel}>
            <div className={s.panelTitle}>
              <div>
                <h2>Your agreements</h2>
                <p>Keep the work moving, one interaction at a time.</p>
              </div>
              <Link className={s.textLink} href="/agreements">
                View all
                <Icon name="arrow" />
              </Link>
            </div>
            <AgreementTable agreements={agreements.slice(0, 4)} />
          </section>
          <section>
            <div className={s.sectionTitle}>
              <div>
                <p className={s.eyebrow}>FROM THE PEOPLE YOU WORK WITH</p>
                <h2>Latest feedback</h2>
              </div>
              <Link className={s.textLink} href="/reviews">
                All reviews
                <Icon name="arrow" />
              </Link>
            </div>
            {received[0] && (
              <ReviewCard
                review={received[0]}
                agreement={agreements.find(
                  (a) => a.id === received[0].agreement_id,
                )}
              />
            )}
          </section>
        </div>
        <div className={s.stack}>
          <section className={s.profileSummary}>
            <div className={s.cardHeader}>
              <Avatar name={profile.display_name} large />
              <span className={s.lightLabel}>YOUR PUBLIC PROFILE</span>
            </div>
            <h2>{profile.display_name}</h2>
            <p>
              Your completed work and the people behind it, together in one
              place.
            </p>
            <div className={s.profileNumbers}>
              <div>
                <strong>
                  {received.length
                    ? (
                        received.reduce((n, r) => n + r.rating, 0) /
                        received.length
                      ).toFixed(1)
                    : "—"}
                </strong>
                <span>Average rating</span>
              </div>
              <div>
                <strong>{received.length}</strong>
                <span>Received reviews</span>
              </div>
            </div>
            <Link href="/profile">
              Preview public profile
              <Icon name="arrow" />
            </Link>
          </section>
          <section className={s.panel}>
            <div className={s.panelTitle}>
              <h2>Next up</h2>
              <span className={s.count}>{ready.length}</span>
            </div>
            <div className={s.nextList}>
              {ready.length ? (
                ready.map((a) => (
                  <Link
                    href={`/agreements/${a.id}/review`}
                    className={s.nextItem}
                    key={a.id}
                  >
                    <span className={s.softIcon}>
                      <Icon name="star" />
                    </span>
                    <span>
                      <strong>
                        Review {counterpart(a).name.split(" ")[0]}
                      </strong>
                      <small>{a.title}</small>
                    </span>
                    <Icon name="arrow" />
                  </Link>
                ))
              ) : (
                <p className={s.padded}>
                  You’re all caught up. Your next completed agreement will
                  appear here.
                </p>
              )}
            </div>
          </section>
          <div className={s.quietNote}>
            <Icon name="shield" />
            <p>
              <strong>What does verified mean?</strong>A verification record
              connects a review to a completed interaction. The feedback is
              still the reviewer’s opinion.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

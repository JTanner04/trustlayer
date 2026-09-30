"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { usePreview } from "./preview-context";
import { CURRENT_USER } from "./model";
import { Avatar, Empty, Heading, Icon, ReviewCard } from "./ui";
import s from "./workspace.module.css";

export function PublicProfile() {
  const { profile, reviews, agreements } = usePreview();
  const received = reviews.filter((r) => r.reviewed_user_id === CURRENT_USER);
  const [message, setMessage] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage(
        "Preview link copied. It opens the sample profile, not a live account.",
      );
    } catch {
      setMessage("Copy the address from your browser to share this preview.");
    }
  }
  return (
    <>
      <Heading
        eyebrow="SEE WHAT OTHERS WILL SEE"
        title="Your public profile"
        description="A preview of your work history and the feedback behind it."
        action={
          <Link className={s.secondary} href="/settings">
            <Icon name="settings" />
            Edit profile
          </Link>
        }
      />
      <section className={s.publicHero}>
        <div className={s.profileCover}>
          <span>
            <Icon name="layers" />
            TRUSTLAYER REPUTATION PROFILE
          </span>
          <span>SAMPLE PROFILE</span>
        </div>
        <div className={s.publicIdentity}>
          <Avatar name={profile.display_name} large />
          <div>
            <p className={s.eyebrow}>INDEPENDENT PROFESSIONAL</p>
            <h2>{profile.display_name}</h2>
            <p>
              {profile.bio ||
                "Add a short introduction in your profile settings."}
            </p>
          </div>
          <button className={s.secondary} onClick={copy}>
            <Icon name="external" />
            Copy preview link
          </button>
        </div>
        {message && (
          <p role="status" className={s.copyMessage}>
            {message}
          </p>
        )}
        <div className={s.publicStats}>
          <div>
            <strong>
              {received.length
                ? (
                    received.reduce((n, r) => n + r.rating, 0) / received.length
                  ).toFixed(1)
                : "—"}
              <small> / 5</small>
            </strong>
            <span>Average review rating</span>
          </div>
          <div>
            <strong>{received.length}</strong>
            <span>Reviews received</span>
          </div>
          <div>
            <strong>
              {
                received.filter((r) => r.verification_status === "verified")
                  .length
              }
            </strong>
            <span>Verified reviews</span>
          </div>
          <div>
            <strong>
              {agreements.filter((a) => a.status === "completed").length}
            </strong>
            <span>Completed agreements</span>
          </div>
        </div>
      </section>
      <div className={s.sectionTitle}>
        <div>
          <p className={s.eyebrow}>FROM COMPLETED INTERACTIONS</p>
          <h2>Reputation history</h2>
        </div>
        <span className={s.muted}>{received.length} reviews</span>
      </div>
      {received.length ? (
        <div className={s.reviewGrid}>
          {received.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              agreement={agreements.find((a) => a.id === r.agreement_id)}
            />
          ))}
        </div>
      ) : (
        <Empty title="Your story starts with the first review">
          <p>Feedback from completed agreements will appear here.</p>
        </Empty>
      )}
    </>
  );
}

export function ProfileSettings() {
  const { profile, saveProfile } = usePreview();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const display_name = String(data.get("display_name") ?? "").trim();
    const wallet_address = String(data.get("wallet_address") ?? "").trim();
    if (!display_name) {
      setMessage("");
      return setError("Enter a display name.");
    }
    if (
      wallet_address &&
      !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet_address)
    ) {
      setMessage("");
      return setError(
        "Enter a Solana-style public address (32–44 base58 characters), or leave it blank.",
      );
    }
    saveProfile({
      display_name,
      bio: String(data.get("bio") ?? "").trim(),
      wallet_address,
    });
    setError("");
    setMessage("Profile updated in this preview. Changes reset on refresh.");
  }
  return (
    <>
      <Heading
        eyebrow="MAKE IT YOURS"
        title="Profile settings"
        description="Give people a little context about the person behind the work."
        action={
          <Link className={s.secondary} href="/profile">
            View public profile
            <Icon name="external" />
          </Link>
        }
      />
      <div className={s.formGrid}>
        <form
          onSubmit={submit}
          className={`${s.panel} ${s.form}`}
          onChange={() => {
            setMessage("");
            setError("");
          }}
        >
          <div className={s.reviewSubject}>
            <Avatar name={profile.display_name} large />
            <div>
              <h2>{profile.display_name}</h2>
              <p>Your initials update with your display name.</p>
            </div>
          </div>
          <label className={s.field}>
            Display name
            <input
              name="display_name"
              defaultValue={profile.display_name}
              required
              maxLength={80}
              autoComplete="name"
            />
          </label>
          <label className={s.field}>
            About you
            <textarea
              name="bio"
              defaultValue={profile.bio}
              rows={4}
              maxLength={1000}
              placeholder="Tell others about your work and how you like to collaborate."
            />
            <span>This introduction appears on your public profile.</span>
          </label>
          <div className={s.divider} />
          <div className={s.formSection}>
            <h2>
              <Icon name="wallet" />
              Solana wallet address
            </h2>
            <p>
              Add a public address to preview the profile field. This does not
              connect a wallet or prove ownership.
            </p>
          </div>
          <label className={s.field}>
            Public wallet address <span className={s.optional}>Optional</span>
            <input
              name="wallet_address"
              defaultValue={profile.wallet_address}
              placeholder="Paste your public Solana address"
              spellCheck={false}
              autoCapitalize="none"
            />
            <span>
              Use a public address only. Never enter a seed phrase or private
              key.
            </span>
          </label>
          {error && (
            <p role="alert" className={s.error}>
              {error}
            </p>
          )}
          {message && (
            <p role="status" className={s.success}>
              <Icon name="check" />
              {message}
            </p>
          )}
          <div className={s.formActions}>
            <Link href="/profile" className={s.secondary}>
              Cancel
            </Link>
            <button className={s.primary} type="submit">
              Save preview changes
              <Icon name="check" />
            </button>
          </div>
        </form>
        <aside className={s.helpCard}>
          <Icon name="person" />
          <h2>A profile with a person behind it.</h2>
          <p>
            Use the name you want collaborators to recognize, and a short
            introduction to the work you do.
          </p>
          <div className={s.divider} />
          <p className={s.smallLabel}>YOUR SAMPLE USER ID</p>
          <code className={s.code}>{CURRENT_USER}</code>
          <p className={s.footnote}>
            Other people will use your user ID when creating an agreement with
            you.
          </p>
        </aside>
      </div>
    </>
  );
}

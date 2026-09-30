import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./auth-screen.module.css";

type IconName = "layers" | "arrow" | "back" | "shield";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    back: <path d="M20 12H4m6-6-6 6 6 6" />,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
  };

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export default function AuthScreen({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";

  return (
    <div className={styles.page}>
      <a href="#auth-content" className={styles.skipLink}>Skip to account fields</a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="TrustLayer home">
          <span className={styles.brandMark}><Icon name="layers" /></span>
          TrustLayer<span className={styles.brandDot}>.</span>
        </Link>
      </header>

      <main id="auth-content" className={styles.formStage}>
        <section className={styles.formCard} aria-labelledby="auth-title">
          <div className={styles.formPanel}>
            <div className={styles.formHeading}>
              <div className={styles.formTop}>
                <span className={styles.accountIcon}><Icon name={isSignup ? "layers" : "shield"} /></span>
                <Link href="/" className={styles.backButton}><Icon name="back" />Back to homepage</Link>
              </div>
              <p className={styles.eyebrow}>{isSignup ? "YOUR NEXT CHAPTER STARTS HERE" : "YOUR WORK. YOUR REPUTATION."}</p>
              <h1 id="auth-title">{isSignup ? "Create your account." : "Welcome back."}</h1>
              <p className={styles.description}>
                {isSignup
                  ? "Start a reputation built on completed work and the people you work with."
                  : "Log in to your TrustLayer account and pick up where you left off."}
              </p>
            </div>

            {/* Account submission remains disabled until authentication is connected. */}
            <div className={styles.fields} role="group" aria-label={isSignup ? "Sign up details" : "Login details"}>
              {isSignup && (
                <div className={styles.field}>
                  <label htmlFor="name">Full name</label>
                  <input id="name" name="name" type="text" autoComplete="name" placeholder="Your full name" />
                </div>
              )}
              <div className={styles.field}>
                <label htmlFor="email">Email address</label>
                <input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" />
              </div>
              <div className={styles.field}>
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} placeholder={isSignup ? "Create a password" : "Enter your password"} />
              </div>
              {isSignup && (
                <div className={styles.field}>
                  <label htmlFor="confirm-password">Confirm password</label>
                  <input id="confirm-password" name="confirm-password" type="password" autoComplete="new-password" placeholder="Re-enter your password" />
                </div>
              )}
              <button type="button" className={styles.submitButton} disabled aria-describedby="preview-note">
                {isSignup ? "Create account" : "Log in"}<Icon name="arrow" />
              </button>
            </div>

            <div className={styles.previewNote} id="preview-note">
              <span className={styles.previewDot} />
              <p><strong>Frontend preview</strong>Account {isSignup ? "creation" : "login"} isn’t connected yet.</p>
            </div>
            <p className={styles.switchAccount}>
              {isSignup ? "Already have an account? " : "New to TrustLayer? "}
              <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Log in" : "Create an account"}<Icon name="arrow" /></Link>
            </p>
          </div>
        </section>
      </main>
      <footer className={styles.footer}><span>TrustLayer.</span> Real work. Verifiable reputation.</footer>
    </div>
  );
}

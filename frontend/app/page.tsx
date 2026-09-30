import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./page.module.css";

type IconName = "layers" | "arrow" | "check" | "shield" | "globe" | "document";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
    document: <><path d="M14 3H5v18h14V8l-5-5Z" /><path d="M14 3v5h5M8 12h8M8 16h5" /></>,
  };

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const workflow = [
  { title: "Set up your profile", text: "Introduce yourself and connect a Solana wallet to start building your reputation.", icon: "globe" },
  { title: "Agree on the work", text: "Create an agreement with another user. They accept it before the work begins.", icon: "document" },
  { title: "Complete & review", text: "Mark the agreement complete. Only its participants can leave a review, once per person.", icon: "check" },
  { title: "Make trust verifiable", text: "A verification record is written to Solana. Visitors can check the review on your public profile.", icon: "shield" },
] as const;

function ProfilePreview() {
  return (
    <figure className={styles.preview} id="profile-preview" aria-labelledby="preview-caption">
      <div className={styles.previewTop}>
        <span><Icon name="layers" /> PUBLIC REPUTATION PROFILE</span>
        <span className={styles.demoBadge}>SAMPLE DATA</span>
      </div>
      <div className={styles.profileBody}>
        <div className={styles.profileIdentity}>
          <div className={styles.avatar} aria-hidden="true">M</div>
          <div>
            <p className={styles.smallLabel}>MEET THE FREELANCER</p>
            <h2>Marcus</h2>
            <p>Independent software developer</p>
          </div>
        </div>
        <p className={styles.profileBio}>Building thoughtful web experiences for small businesses.</p>
        <div className={styles.profileStats}>
          <div><strong>01</strong><span>Completed agreement</span></div>
          <div><strong>01</strong><span>Verified review</span></div>
          <div><strong>5<span>/5</span></strong><span>Client rating</span></div>
        </div>
        <div className={styles.activityHeading}><h3>Behind the reputation</h3><span>01 INTERACTION</span></div>
        <div className={styles.agreement}>
          <span className={styles.agreementIcon}><Icon name="document" /></span>
          <div><strong>Online storefront redesign</strong><span>Agreement with Sarah · Small business owner</span></div>
          <span className={styles.completeBadge}><Icon name="check" />Complete</span>
        </div>
        <div className={styles.review}>
          <div className={styles.reviewHeading}>
            <span className={styles.reviewerAvatar} aria-hidden="true">S</span>
            <div><strong>Sarah</strong><span>Client · Agreement participant</span></div>
            <span className={styles.rating} aria-label="5 out of 5 stars">★★★★★</span>
          </div>
          <blockquote>“Clear communication and a storefront that does exactly what we agreed on. A great person to work with.”</blockquote>
          <p><Icon name="check" />Review linked to a completed agreement</p>
        </div>
      </div>
      <div className={styles.verificationRecord}>
        <span className={styles.verificationIcon}><Icon name="shield" /></span>
        <div><strong>Solana verification record</strong><span>Connects this review to the completed interaction</span></div>
        <span className={styles.recordLabel}>EXAMPLE</span>
      </div>
      <figcaption id="preview-caption">Illustrative profile and review. No live account or blockchain transaction.</figcaption>
    </figure>
  );
}

export default function Home() {
  return (
    <div className={styles.page}>
      <a href="#main-content" className={styles.skipLink}>Skip to content</a>
      <header className={`${styles.container} ${styles.header}`}>
        <Link href="/" className={styles.brand} aria-label="TrustLayer home">
          <span className={styles.brandMark}><Icon name="layers" /></span>TrustLayer<span className={styles.brandDot}>.</span>
        </Link>
        <nav aria-label="Main navigation" className={styles.navigation}>
          <a href="#how-it-works" className={styles.sectionLink}>How it works</a>
          <Link href="/login" className={styles.navLink}>Log in</Link>
          <Link href="/signup" className={`${styles.button} ${styles.navButton}`}>Sign up<Icon name="arrow" /></Link>
        </nav>
      </header>

      <main id="main-content">
        <section className={`${styles.container} ${styles.hero}`} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span className={styles.statusDot} />REPUTATION, BACKED BY REAL WORK</p>
            <h1 id="hero-title">You did the work.<br />Let your reputation<br /><span className={styles.accent}>prove it.</span></h1>
            <p className={styles.heroDescription}>A portable reputation for freelancers, developers, and designers. Turn completed agreements into client reviews with verification records on Solana.</p>
            <div className={styles.actions}>
              <Link href="/signup" className={`${styles.button} ${styles.primaryButton}`}>Get started<Icon name="arrow" /></Link>
              <a href="#how-it-works" className={`${styles.button} ${styles.secondaryButton}`}>See how it works<Icon name="arrow" /></a>
            </div>
            <p className={styles.heroNote}>For the people doing the work.<br />And the people deciding who to trust.</p>
            <div className={styles.heroFootnote}><span className={styles.miniMark}><Icon name="shield" /></span><span>Designed for independent verification.<br /><strong>Built around completed interactions.</strong></span></div>
          </div>
          <ProfilePreview />
        </section>

        <div className={`${styles.container} ${styles.valueStrip}`} aria-label="TrustLayer principles">
          <span><Icon name="document" />Reviews tied to completed work</span>
          <span><Icon name="shield" />Verification records on Solana</span>
          <span><Icon name="globe" />A public reputation that travels</span>
        </div>

        <section id="how-it-works" className={`${styles.container} ${styles.workflow}`} aria-labelledby="workflow-title">
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>FROM FIRST AGREEMENT TO LASTING TRUST</p><h2 id="workflow-title">Real work. A review. A record.</h2></div>
            <p>The workflow we’re building turns an interaction between two people into a reputation others can check.</p>
          </div>
          <ol className={styles.steps}>
            {workflow.map((step, index) => (
              <li className={styles.step} key={step.title}>
                <div className={styles.stepTop}><span className={styles.stepNumber}>0{index + 1}</span><Icon name={step.icon} /></div>
                <h3>{step.title}</h3><p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={`${styles.container} ${styles.audience}`} aria-labelledby="audience-title">
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>TWO SIDES. ONE SHARED RECORD.</p><h2 id="audience-title">A clearer picture of who you work with.</h2></div>
          </div>
          <div className={styles.audienceGrid}>
            <article className={styles.workerCard}>
              <span className={styles.audienceLabel}>FOR FREELANCERS & INDEPENDENT CONTRACTORS</span>
              <h3>Your past work should<br />open the next door.</h3>
              <p>Build a public history of completed agreements and participant reviews. Give a potential client evidence of your experience beyond a single platform.</p>
              <a href="#profile-preview" className={styles.textLink}>See the example profile<Icon name="arrow" /></a>
              <div className={styles.profileChips}><span>Developers</span><span>Designers</span><span>Independent professionals</span></div>
            </article>
            <article className={styles.clientCard}>
              <span className={styles.audienceLabel}>FOR CLIENTS, RECRUITERS & SMALL BUSINESSES</span>
              <h3>Understand the work<br />behind the review.</h3>
              <p>See which completed agreement a review came from and check its verification record before choosing who to work with.</p>
              <ul className={styles.clientChecklist}>
                <li><Icon name="check" />A completed agreement behind each review</li>
                <li><Icon name="check" />Feedback from someone who participated</li>
                <li><Icon name="check" />A record you can independently verify</li>
              </ul>
            </article>
          </div>
        </section>

        <section className={`${styles.container} ${styles.verificationSection}`} aria-labelledby="verification-title">
          <div className={styles.verificationIntro}>
            <span className={styles.largeIcon}><Icon name="shield" /></span>
            <p className={styles.eyebrow}>WHAT VERIFICATION MEANS</p>
            <h2 id="verification-title">The review has a history.<br />You should be able to check it.</h2>
            <p>TrustLayer is designed to show that a review originated from a completed interaction and that its record hasn’t been altered. The review itself is still the participant’s opinion.</p>
          </div>
          <div className={styles.recordDetails}>
            <div><span className={styles.detailNumber}>01</span><div><h3>The work comes first</h3><p>Reviews become available only after an agreement is complete, with one review per participant.</p></div></div>
            <div><span className={styles.detailNumber}>02</span><div><h3>Proof on Solana</h3><p>Verification information links the review to the interaction so visitors can check its authenticity.</p></div></div>
            <div><span className={styles.detailNumber}>03</span><div><h3>Personal details stay off-chain</h3><p>Profile details and full review text stay in the application. Only the information needed for verification goes on-chain.</p></div></div>
          </div>
        </section>
      </main>

      <footer className={`${styles.container} ${styles.footer}`}>
        <span><strong>TrustLayer.</strong> Real work. Verifiable reputation.</span>
        <p><span className={styles.statusDot} />Frontend preview · Agreements, reviews, and verification are in development.</p>
      </footer>
    </div>
  );
}

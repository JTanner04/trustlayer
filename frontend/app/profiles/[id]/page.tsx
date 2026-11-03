import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./public-profile.module.css";

type Review = {
  id: string;
  rating: number;
  review_text: string;
  verification_status: "pending" | "verified" | "failed";
  blockchain_transaction: string | null;
  created_at: string;
};

type PublicProfile = {
  user_id: string;
  display_name: string;
  bio: string;
  wallet_address: string | null;
  reviews: Review[];
};

async function loadProfile(id: string): Promise<PublicProfile> {
  const apiUrl = process.env.TRUSTLAYER_API_URL ?? "http://127.0.0.1:3001";
  const response = await fetch(`${apiUrl}/profiles/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (!response.ok) notFound();
  return response.json();
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await loadProfile(id);
  const verified = profile.reviews.filter((review) => review.verification_status === "verified").length;
  const average = profile.reviews.length
    ? (profile.reviews.reduce((total, review) => total + review.rating, 0) / profile.reviews.length).toFixed(1)
    : "-";

  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>TrustLayer<span>.</span></Link>
        <Link href="/login" className={styles.login}>Log in</Link>
      </nav>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>PUBLIC REPUTATION PROFILE</p>
        <h1>{profile.display_name}</h1>
        <p>{profile.bio || "This TrustLayer member has not added a bio yet."}</p>
        <code>{profile.user_id}</code>
      </section>
      <section className={styles.metrics} aria-label="Reputation summary">
        <div><strong>{average}</strong><span>Average rating</span></div>
        <div><strong>{profile.reviews.length}</strong><span>Received reviews</span></div>
        <div><strong>{verified}</strong><span>Verified records</span></div>
      </section>
      <section className={styles.reviews}>
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>REPUTATION HISTORY</p><h2>Reviews received</h2></div>
          {profile.wallet_address && <code title="Public wallet address">Wallet: {profile.wallet_address}</code>}
        </div>
        {profile.reviews.length ? profile.reviews.map((review) => (
          <article key={review.id} className={styles.review}>
            <div><strong>{"★".repeat(review.rating)}<span>{"★".repeat(5 - review.rating)}</span></strong><time>{new Date(review.created_at).toLocaleDateString()}</time></div>
            <p>{review.review_text}</p>
            <footer>
              <span className={review.verification_status === "verified" ? styles.verified : styles.failed}>{review.verification_status}</span>
              {review.blockchain_transaction && <a href={`https://explorer.solana.com/tx/${review.blockchain_transaction}?cluster=devnet`} target="_blank" rel="noreferrer">Verify on Solana Explorer</a>}
            </footer>
          </article>
        )) : <p className={styles.empty}>No reviews have been received yet.</p>}
      </section>
    </main>
  );
}

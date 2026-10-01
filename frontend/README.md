# TrustLayer frontend

Next.js user interface for the TrustLayer MVP. It communicates with the local
Rust/Axum API through server-side route handlers, so the API JWT stays in an
HttpOnly browser cookie.

## Run locally

Start the API first (see the repository [README](../README.md)), then install
dependencies and start Next.js:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register an account, and
log in. By default, the frontend connects to `http://127.0.0.1:3001`.

To use a different API URL, create an ignored local file named `.env.local`:

```env
TRUSTLAYER_API_URL=http://127.0.0.1:3001
```

## Workspace routes

- `/dashboard`: overview, open work, received feedback, and reviews to write.
- `/agreements`: searchable list with open/completed filters.
- `/agreements/new`: create an agreement by entering another account's user ID.
- `/agreements/[id]`: details, participant acceptance, completion, and related reviews.
- `/agreements/[id]/review`: one review per participant after completion.
- `/reviews`: received/given reviews, reviews to write, and verification filters.
- `/reviews/[id]/verification`: failed or verified backend records and Solana Explorer link.
- `/profile`: public profile and reputation history.
- `/settings`: edit display name, bio, and optional public wallet address.

The workspace follows the API workflow: create → invited participant accepts →
either participant completes → each participant can leave one review. Entering a
wallet address only stores a public profile field; it does not prove wallet
ownership. Solana review verification is enabled only when the API has a funded
Devnet signer configured.

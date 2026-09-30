This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## TrustLayer workspace preview

Run the frontend and open `http://localhost:3000/dashboard`, or use the preview
link on the login and signup pages. No login or running API is needed.

- `/dashboard`: overview, open work, received feedback, and reviews to write.
- `/agreements`: searchable list with open/completed filters.
- `/agreements/new`: create a temporary agreement using a sample participant ID.
- `/agreements/[id]`: details, completion confirmation, and related reviews.
- `/agreements/[id]/review`: one review per participant after completion.
- `/reviews`: received/given reviews, reviews to write, and verification filters.
- `/reviews/[id]/verification`: pending, verified, and failed sample records.
- `/profile`: public profile preview and reputation history.
- `/settings`: edit the preview display name, bio, and optional wallet address.

The UI uses in-memory fixtures in `app/components/workspace/model.ts` and a shared
React provider. Client navigation keeps changes; refreshing or leaving the workspace
resets them. No API calls, authentication sessions, wallet connections, or blockchain
transactions are performed. Example verified records are labeled sample data and
have no explorer links.

The preview follows the existing API's open/completed agreement states. The API
currently has no agreement acceptance endpoint, agreement listing/detail GET routes,
or sent-review listing route. Those will need to be addressed when wiring up the
workspace. New review previews remain pending; entering a wallet address only edits
the profile field and does not prove wallet ownership.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

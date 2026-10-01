# TrustLayer

TrustLayer is a reputation platform where completed agreements and peer reviews
build a portable, verifiable work history. The MVP records a privacy-preserving
verification digest for each review on Solana Devnet.

## Technology stack

- Frontend: React / Next.js
- Backend: Rust + Axum
- Database: PostgreSQL
- Verification records: Solana Memo program on Devnet

## Team

- Jeremiah Tanner
- Jailin West

## Run locally

### Prerequisites

- Node.js 20 or later and npm
- Rust stable toolchain
- PostgreSQL 15 or later
- Optional: Solana CLI and a funded Devnet keypair for live verification records

### 1. Create the local database

Start PostgreSQL, then create an empty database. The default command uses your
local PostgreSQL user; if yours needs credentials, use its connection string in
the next step instead.

```sh
createdb trustlayer
```

### 2. Start the API

From `axum-api`, set local-only environment variables and run the server.
Migrations apply automatically on startup.

```sh
cd axum-api
export DATABASE_URL='postgres://<postgres-user>:<postgres-password>@localhost:5432/trustlayer'
export JWT_SECRET="$(openssl rand -hex 32)"
cargo run
```

The API listens at `http://127.0.0.1:3001`. Confirm it is healthy at
`http://127.0.0.1:3001/health`.

### 3. Start the frontend

Open another terminal:

```sh
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`, create an account, and log in. The frontend uses
`http://127.0.0.1:3001` by default. If your API uses another address, copy
`frontend/.env.example` to the ignored `frontend/.env.local` and set
`TRUSTLAYER_API_URL` there before starting Next.js.

### Optional: enable Devnet verification

Live verification is deliberately opt-in. Keep a funded **Devnet-only** keypair
outside the repository, then set its local path before starting the API:

```sh
export SOLANA_RPC_URL='https://api.devnet.solana.com'
export SOLANA_KEYPAIR_PATH='/absolute/path/outside/the/repository/devnet-keypair.json'
```

Never commit keypair JSON, a seed phrase, `.env` files, or a real JWT secret.
Without these Solana variables, all account, profile, agreement, and review
features work; review verification will be marked `failed` because no on-chain
signer is configured.

## Project layout

```text
trustlayer/
├── frontend/       Next.js user interface
├── axum-api/       Rust/Axum API and PostgreSQL migrations
├── docs/           Proposal and architecture reference
├── BACKLOG.md      Product backlog and acceptance criteria
└── README.md
```

See the [frontend README](frontend/README.md) and [API README](axum-api/README.md)
for component-specific details.

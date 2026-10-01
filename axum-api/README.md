# TrustLayer API

Rust/Axum API for TrustLayer's MVP. It uses PostgreSQL migrations and JWT bearer
tokens; passwords are stored with bcrypt.

## Run locally

Create an empty PostgreSQL database, then export the required local environment
variables. Use a unique random value for `JWT_SECRET`; do not reuse this example.

```sh
createdb trustlayer
export DATABASE_URL='postgres://trustlayer:trustlayer@localhost:5432/trustlayer'
export JWT_SECRET="$(openssl rand -hex 32)"
cargo run
```

Replace the PostgreSQL URL with the credentials for your local installation.
`.env.example` contains placeholders only. The API intentionally reads
environment variables rather than loading a secrets file; never commit a local
`.env` file.

The API applies its migrations automatically and listens on `127.0.0.1:3001` by
default. Use `GET /health` to confirm it is running.

## API flow

1. `POST /auth/register` with `email`, `password` (12+ characters), and `display_name`.
2. `POST /auth/login` returns a bearer token.
3. Use `Authorization: Bearer <token>` for profile changes, agreements, and reviews.
4. `POST /agreements` creates an agreement. The invited participant calls
   `POST /agreements/{id}/accept`; either participant can then call
   `POST /agreements/{id}/complete`.
5. A participant may then `POST /reviews` once for that agreement.

`GET /profiles/{user_id}` is public and includes the profile's received reviews.
`GET /reviews/{id}/verification` returns the review's verification state and Solana transaction field. Reviews begin as
`verified` and writes its transaction signature after it submits the on-chain
verification record.

## Solana Devnet verification

Set `SOLANA_KEYPAIR_PATH` to the absolute path of a funded **Devnet-only**
keypair that lives outside this repository, and optionally set `SOLANA_RPC_URL`.
When a review is created, the API hashes the review ID, agreement ID, participant
IDs, and rating; it writes only that SHA-256 digest to Solana's Memo program, then
stores the confirmed transaction signature. The review text, email, password, and
wallet secrets never go on-chain.

Without a configured signer, review creation still succeeds but its verification
status is `failed`; this makes missing Devnet configuration visible rather than
claiming a record exists. Never use a wallet containing real funds or commit a
keypair JSON, seed phrase, or `.env` file.

Authenticated list and detail routes are available for workspace integration:

- `GET /agreements` (optional `?status=open` or `?status=completed`)
- `GET /agreements/{id}`
- `GET /reviews?scope=received` and `GET /reviews?scope=given`

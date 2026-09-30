# TrustLayer API

Rust/Axum API for TrustLayer's MVP. It uses PostgreSQL migrations and JWT bearer
tokens; passwords are stored with bcrypt.

## Run locally

Create a PostgreSQL database and export the required environment variables:

```sh
export DATABASE_URL='postgres://trustlayer:trustlayer@localhost:5432/trustlayer'
export JWT_SECRET='a-long-random-development-secret'
cargo run
```

`.env.example` lists the same values for reference; the API intentionally reads
environment variables rather than loading a secrets file.

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
`pending`; a Solana signer/RPC worker will update the record to `verified` and
write its transaction signature after it submits the on-chain verification record.

Authenticated list and detail routes are available for workspace integration:

- `GET /agreements` (optional `?status=open` or `?status=completed`)
- `GET /agreements/{id}`
- `GET /reviews?scope=received` and `GET /reviews?scope=given`

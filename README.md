# TrustLayer

TrustLayer is a blockchain-backed reputation platform that allows users
to build portable, verifiable reputations based on completed interactions
and peer reviews.

Instead of relying entirely on a centralized platform to control reputation
data, TrustLayer records verification information on the Solana blockchain.
Users can independently verify that reputation records are authentic and
have not been altered.

## Proposed Technology Stack

- Frontend: React / Next.js
- Backend: Rust + Axum
- Database: PostgreSQL
- Blockchain: Solana
- Smart Contracts: Rust + Anchor
- Containerization: Docker

## Team Members

- Jeremiah Tanner
- Jailin West

## Project Status

Project Milestone 1 - MVP implementation in progress

## Local development

```text
trustlayer/
├── frontend/       Next.js user interface
├── axum-api/       Rust/Axum API and PostgreSQL migrations
├── docs/           Proposal and architecture reference
├── BACKLOG.md      Product backlog and acceptance criteria
└── README.md
```

Start the two applications in separate terminals:

```sh
# Terminal 1 — frontend
cd frontend
npm install
npm run dev
```

```sh
# Terminal 2 — backend (PostgreSQL must be running)
cd axum-api
export DATABASE_URL='postgres://trustlayer:trustlayer@localhost:5432/trustlayer'
export JWT_SECRET='replace-with-a-long-random-secret'
cargo run
```

The frontend runs at http://localhost:3000 and the API at http://localhost:3001.
See the [frontend README](frontend/README.md) and [API README](axum-api/README.md)
for component-specific setup.

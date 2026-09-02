# TrustLayer Product Backlog

## High Priority

### US-01 - User Registration
As a user, I want to create an account so that I can establish
a TrustLayer profile.

Acceptance Criteria:
- User can register with valid credentials.
- Duplicate accounts are rejected.
- User receives confirmation after successful registration.

### US-02 - User Authentication
As a registered user, I want to securely log in so that I can
access my TrustLayer account.

Acceptance Criteria:
- Valid users can log in.
- Invalid credentials are rejected.
- Authentication sessions are securely managed.

### US-03 - Create Agreement
As a user, I want to create a work agreement with another user
so that the interaction can later produce a verified reputation record.

Acceptance Criteria:
- User can identify another TrustLayer user.
- User can provide a title and description.
- Agreement is stored successfully.

### US-04 - Complete Agreement
As a participant, I want to mark an agreement as completed so
that the other participant can leave a verified review.

Acceptance Criteria:
- Only agreement participants can mark completion.
- Completed agreements become eligible for review.

### US-05 - Submit Verified Review
As a user, I want to review someone after completing an agreement
so that my experience contributes to their reputation.

Acceptance Criteria:
- Reviews can only be created for completed agreements.
- A user cannot review the same agreement multiple times.
- Verification information is recorded on Solana.

### US-06 - View Reputation Profile
As a visitor, I want to view someone's reputation so that I can
evaluate their previous verified interactions.

Acceptance Criteria:
- Profile displays reputation information.
- Profile displays verified reviews.
- Blockchain verification status is visible.

## Medium Priority

### US-07 - Connect Solana Wallet
As a user, I want to connect my Solana wallet to my TrustLayer account.

### US-08 - Verify Review
As a visitor, I want to independently verify that a review exists
on the blockchain.

### US-09 - Search Profiles
As a user, I want to search for other TrustLayer users.

## Low Priority / Future

### US-10 - Skill-Based Reputation
As a user, I want separate reputation scores for different skills.

### US-11 - Dispute Review
As a user, I want to dispute potentially fraudulent reviews.

### US-12 - Reputation Badges
As a user, I want to earn badges based on verified activity.
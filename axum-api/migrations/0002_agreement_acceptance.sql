ALTER TABLE agreements ADD COLUMN accepted_at TIMESTAMPTZ;

CREATE INDEX agreements_participants_idx
  ON agreements (creator_id, participant_id, created_at DESC);

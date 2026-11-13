CREATE TABLE "tracker_challenges" (
  "id" uuid PRIMARY KEY,
  "creator_id" integer NOT NULL,
  "player_id" integer,
  "moderator_id" integer,
  "player_invite" text NOT NULL,
  "moderator_invite" text NOT NULL,
  "player_guest" text,
  "moderator_guest" text,
  "player_nostr" text,
  "moderator_nostr" text,
  "state" jsonb NOT NULL
);
CREATE UNIQUE INDEX "tracker_challenges_player_invite_key" ON "tracker_challenges"("player_invite");
CREATE UNIQUE INDEX "tracker_challenges_moderator_invite_key" ON "tracker_challenges"("moderator_invite");
CREATE INDEX "tracker_challenges_creator_id_idx" ON "tracker_challenges"("creator_id");
CREATE INDEX "tracker_challenges_player_id_idx" ON "tracker_challenges"("player_id");
CREATE INDEX "tracker_challenges_moderator_id_idx" ON "tracker_challenges"("moderator_id");
CREATE TABLE "tracker_challenge_proofs" (
  "id" text PRIMARY KEY,
  "challenge_id" uuid NOT NULL REFERENCES "tracker_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

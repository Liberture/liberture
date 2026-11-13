CREATE TABLE tracker_challenge_moderators (
  user_id integer PRIMARY KEY REFERENCES habit_users(id) ON DELETE CASCADE,
  pubkey text NOT NULL UNIQUE,
  name text NOT NULL
);

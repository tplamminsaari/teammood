CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  name_lower  VARCHAR(100) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_active TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mood_entries (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER      NOT NULL REFERENCES users(id),
  entry_date   DATE         NOT NULL,
  mood_rating  SMALLINT     NOT NULL CHECK (mood_rating BETWEEN 1 AND 5),
  image_data   TEXT,
  has_trophy   BOOLEAN      NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entry_date)
);

CREATE TABLE IF NOT EXISTS likes (
  id         SERIAL PRIMARY KEY,
  entry_id   INTEGER     NOT NULL REFERENCES mood_entries(id) ON DELETE CASCADE,
  user_id    INTEGER     NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entry_id, user_id)
);

CREATE TABLE IF NOT EXISTS daily_config (
  config_date  DATE         PRIMARY KEY,
  sprint_name  VARCHAR(200) NOT NULL DEFAULT ''
);

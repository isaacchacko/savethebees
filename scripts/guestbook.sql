-- The guestbook's table (src/app/api/guestbook), made once in Neon.
CREATE TABLE IF NOT EXISTS guestbook (
  id serial PRIMARY KEY,
  name text NOT NULL,
  message text NOT NULL,
  visitor text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

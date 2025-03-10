CREATE TABLE "submission" (id SERIAL PRIMARY KEY, image jsonb);

CREATE TABLE "image_note" (
  id UUID PRIMARY KEY,
  submission_id INTEGER REFERENCES submission(id) NOT NULL,
  note TEXT NOT NULL
);

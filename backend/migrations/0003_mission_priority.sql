ALTER TABLE missions ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high'));

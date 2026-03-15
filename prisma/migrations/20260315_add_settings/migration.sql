-- Add app-wide settings table (key-value store)
CREATE TABLE IF NOT EXISTS "Setting" (
  "key"        TEXT NOT NULL PRIMARY KEY,
  "value"      TEXT NOT NULL DEFAULT '',
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

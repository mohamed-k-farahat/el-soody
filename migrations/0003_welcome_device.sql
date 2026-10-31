-- Free first delivery: also once per device (a random id kept in a cookie by the site).

ALTER TABLE orders ADD COLUMN device TEXT NOT NULL DEFAULT '';
ALTER TABLE welcome_claims ADD COLUMN device TEXT;
CREATE UNIQUE INDEX welcome_claims_device ON welcome_claims(device);

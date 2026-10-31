-- Promo codes and the "first delivery order has free delivery" welcome offer.
-- Money in piasters, like the rest of the schema.

ALTER TABLE orders ADD COLUMN discount        INTEGER NOT NULL DEFAULT 0;   -- taken off the coffee by a promo code
ALTER TABLE orders ADD COLUMN delivery_waived INTEGER NOT NULL DEFAULT 0;   -- delivery fee the customer did not pay (welcome or promo)
ALTER TABLE orders ADD COLUMN promo_code      TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN welcome         INTEGER NOT NULL DEFAULT 0;   -- got the free first delivery
ALTER TABLE orders ADD COLUMN perks_released  INTEGER NOT NULL DEFAULT 0;   -- cancelled/abandoned: its code use and welcome claim were given back

CREATE TABLE promos (
  id            INTEGER PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,              -- upper case letters and digits
  kind          TEXT NOT NULL,                     -- percent | fixed | delivery
  value         INTEGER NOT NULL DEFAULT 0,        -- percent: 1..100, fixed: piasters, delivery: unused
  max_discount  INTEGER NOT NULL DEFAULT 0,        -- cap for percent codes, 0 = no cap
  min_subtotal  INTEGER NOT NULL DEFAULT 0,        -- minimum coffee total, 0 = none
  starts_on     TEXT NOT NULL DEFAULT '',          -- YYYY-MM-DD in Cairo, '' = right away
  ends_on       TEXT NOT NULL DEFAULT '',          -- YYYY-MM-DD in Cairo (last valid day), '' = no end
  max_uses      INTEGER NOT NULL DEFAULT 0,        -- across all customers, 0 = unlimited
  per_customer  INTEGER NOT NULL DEFAULT 1,        -- per phone number, 0 = unlimited
  uses          INTEGER NOT NULL DEFAULT 0,        -- live orders that used it (cancelled ones are given back)
  active        INTEGER NOT NULL DEFAULT 1,
  note          TEXT NOT NULL DEFAULT '',          -- for the owner only
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per order that used a code. The (promo, phone, slot) key makes the
-- per customer limit hold even when two orders arrive at the same moment.
CREATE TABLE promo_uses (
  id        INTEGER PRIMARY KEY,
  promo_id  INTEGER NOT NULL REFERENCES promos(id) ON DELETE CASCADE,
  order_id  INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  phone     TEXT NOT NULL,
  slot      INTEGER,                               -- 1..per_customer, NULL when unlimited
  UNIQUE (promo_id, phone, slot)
);
CREATE INDEX promo_uses_order ON promo_uses(order_id);

-- Free first delivery: one per phone number AND one per address.
CREATE TABLE welcome_claims (
  phone        TEXT PRIMARY KEY,
  address_key  TEXT NOT NULL UNIQUE,               -- address with spaces, punctuation and letter variants removed
  order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('welcome_enabled', '1');

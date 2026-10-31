-- El Soody store schema. Money is stored in piasters (1 EGP = 100).

CREATE TABLE products (
  id          INTEGER PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  kind        TEXT NOT NULL DEFAULT 'coffee',      -- coffee | other
  name_ar     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  origin_ar   TEXT NOT NULL DEFAULT '',
  origin_en   TEXT NOT NULL DEFAULT '',
  notes_ar    TEXT NOT NULL DEFAULT '',
  notes_en    TEXT NOT NULL DEFAULT '',
  story_ar    TEXT NOT NULL DEFAULT '[]',          -- JSON array of paragraphs
  story_en    TEXT NOT NULL DEFAULT '[]',
  tip_ar      TEXT NOT NULL DEFAULT '',
  tip_en      TEXT NOT NULL DEFAULT '',
  tag_ar      TEXT NOT NULL DEFAULT '',
  tag_en      TEXT NOT NULL DEFAULT '',
  roasts      TEXT NOT NULL DEFAULT '',            -- roasts shown in the book: "light,medium,dark"
  color       TEXT NOT NULL DEFAULT '#6E4022',     -- bean color for drawings
  image       TEXT NOT NULL DEFAULT '',            -- /media/... path or r2:<key>
  in_book     INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1,
  sort        INTEGER NOT NULL DEFAULT 0,
  seo_title_ar TEXT NOT NULL DEFAULT '',
  seo_title_en TEXT NOT NULL DEFAULT '',
  seo_desc_ar  TEXT NOT NULL DEFAULT '',
  seo_desc_en  TEXT NOT NULL DEFAULT '',
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row of the printed menu: a product in a section, for some roasts, with three size prices
CREATE TABLE items (
  id          INTEGER PRIMARY KEY,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  section     TEXT NOT NULL,                       -- plain | spiced | french
  roasts      TEXT NOT NULL DEFAULT '',            -- "light,medium" | "dark" | "" (no roast choice)
  label_ar    TEXT NOT NULL DEFAULT '',            -- optional row name (e.g. French coffee flavors)
  label_en    TEXT NOT NULL DEFAULT '',
  price_125   INTEGER,                             -- NULL = not sold in this size
  price_250   INTEGER,
  price_1000  INTEGER,
  available   INTEGER NOT NULL DEFAULT 1,
  sort        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX items_product ON items(product_id);

CREATE TABLE grinds (
  id       INTEGER PRIMARY KEY,
  name_ar  TEXT NOT NULL,
  name_en  TEXT NOT NULL,
  active   INTEGER NOT NULL DEFAULT 1,
  sort     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE orders (
  id              INTEGER PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE,            -- shown to customer and owner, e.g. S1042
  token           TEXT NOT NULL UNIQUE,            -- unguessable id for the order page URL
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  status          TEXT NOT NULL DEFAULT 'new',     -- new | confirmed | preparing | ready | out | completed | cancelled
  fulfilment      TEXT NOT NULL,                   -- pickup | delivery
  payment_method  TEXT NOT NULL,                   -- cod | online
  payment_status  TEXT NOT NULL DEFAULT 'unpaid',  -- unpaid | pending | paid | failed | refunded
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,
  address         TEXT NOT NULL DEFAULT '',
  notes           TEXT NOT NULL DEFAULT '',
  lang            TEXT NOT NULL DEFAULT 'ar',
  subtotal        INTEGER NOT NULL,
  delivery_fee    INTEGER NOT NULL DEFAULT 0,
  total           INTEGER NOT NULL,
  paymob_order_id TEXT,
  paymob_txn_id   TEXT,
  seen            INTEGER NOT NULL DEFAULT 0       -- owner opened it in admin
);
CREATE INDEX orders_status ON orders(status, created_at);

CREATE TABLE order_items (
  id          INTEGER PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER,
  item_id     INTEGER,
  name        TEXT NOT NULL,                       -- snapshot at order time
  details     TEXT NOT NULL DEFAULT '',            -- section, roast, grind as text
  size        INTEGER NOT NULL,                    -- grams
  qty         INTEGER NOT NULL,
  unit_price  INTEGER NOT NULL,
  line_total  INTEGER NOT NULL
);

CREATE TABLE settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);

CREATE TABLE seo_pages (
  page      TEXT PRIMARY KEY,                      -- home | stories | menu | shop | store
  title_ar  TEXT NOT NULL DEFAULT '',
  title_en  TEXT NOT NULL DEFAULT '',
  desc_ar   TEXT NOT NULL DEFAULT '',
  desc_en   TEXT NOT NULL DEFAULT '',
  image     TEXT NOT NULL DEFAULT ''
);

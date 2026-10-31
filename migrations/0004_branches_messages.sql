-- Branches (contact page map, pickup choice) and messages from the contact, issues and suggestions forms.

CREATE TABLE branches (
  id          INTEGER PRIMARY KEY,
  name_ar     TEXT NOT NULL,
  name_en     TEXT NOT NULL DEFAULT '',
  address_ar  TEXT NOT NULL DEFAULT '',
  address_en  TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  hours_ar    TEXT NOT NULL DEFAULT '',
  hours_en    TEXT NOT NULL DEFAULT '',
  lat         REAL,
  lng         REAL,
  maps_url    TEXT NOT NULL DEFAULT '',            -- the branch on Google Maps (for "open in Google Maps")
  pickup      INTEGER NOT NULL DEFAULT 1,          -- customers can pick up orders here
  active      INTEGER NOT NULL DEFAULT 1,
  sort        INTEGER NOT NULL DEFAULT 0
);

INSERT INTO branches (name_ar, name_en, address_ar, address_en, lat, lng, maps_url, sort) VALUES
  ('فرع شارع النادي', 'El Nady Street',
   'طنطا، شارع النادي، ناصية الحمزاوي', 'El Nady Street, corner of El Hamzawy, Tanta',
   30.7955925, 30.9889932,
   'https://www.google.com/maps/place/%D8%A8%D9%86+%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A+Elso%27ody+coffee/@30.7955925,30.9889932,17z/data=!4m6!3m5!1s0x14f7c96528017c0f:0x5541b2e57e63e596!8m2!3d30.7955925!4d30.9889932',
   1),
  ('فرع كورنيش قحافة', 'Qohafa Corniche',
   'كورنيش قحافة، بجوار نايتروس لاكسسوارات السيارات، طنطا', 'Qohafa Corniche, next to Nitrous car accessories, Tanta',
   30.8074853, 31.0019035, '', 2),
  ('فرع شارع ٣٠٦', 'Street 306',
   'شارع ٣٠٦، سور نادي سيتي كلوب، طنطا', 'Street 306, by the City Club wall, Tanta',
   30.8136, 30.99379, '', 3);

ALTER TABLE orders ADD COLUMN branch_id INTEGER;   -- pickup branch

CREATE TABLE messages (
  id          INTEGER PRIMARY KEY,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  kind        TEXT NOT NULL,                       -- contact | issue | suggestion
  name        TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  order_code  TEXT NOT NULL DEFAULT '',
  branch_id   INTEGER,
  message     TEXT NOT NULL,
  lang        TEXT NOT NULL DEFAULT 'ar',
  status      TEXT NOT NULL DEFAULT 'new'          -- new | done
);
CREATE INDEX messages_status ON messages(status, created_at);

INSERT OR IGNORE INTO seo_pages (page, title_ar, title_en, desc_ar, desc_en) VALUES
  ('contact', 'كلّمنا وفروعنا | بن السعودي', 'Contact and branches | El Soody Coffee',
   'فروع بن السعودي في طنطا على الخريطة، وأرقام التليفون والواتساب، وابعتلنا رسالة.',
   'El Soody Coffee branches in Tanta on the map, phone and WhatsApp, and a quick way to message us.'),
  ('issues', 'بلّغ عن مشكلة | بن السعودي', 'Report a problem | El Soody Coffee',
   'حصلت مشكلة في طلب أو في الفرع؟ قولنا وهنحلها.', 'Something went wrong with an order or at a branch? Tell us and we will fix it.'),
  ('suggestions', 'اقتراحاتك | بن السعودي', 'Suggestions | El Soody Coffee',
   'عندك فكرة أو نوع بن نفسك نجيبه؟ قولنا.', 'Have an idea or a coffee you want us to stock? Tell us.');

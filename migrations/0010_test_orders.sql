-- Orders the owner marks as tests (from the order page) stay in the orders list but are left out of the dashboard.
ALTER TABLE orders ADD COLUMN test INTEGER NOT NULL DEFAULT 0;

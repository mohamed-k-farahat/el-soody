-- Dashboard: each order line keeps its style, roast, grind and spice add-on as values (not only as display
-- text), so sales can be sliced by them. Plus indexes for date ranges and per-customer queries.
ALTER TABLE order_items ADD COLUMN section TEXT NOT NULL DEFAULT '';
ALTER TABLE order_items ADD COLUMN roast TEXT NOT NULL DEFAULT '';
ALTER TABLE order_items ADD COLUMN grind_id INTEGER NOT NULL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN spice INTEGER NOT NULL DEFAULT 0;

-- earlier lines: the style can be read from the menu row they were ordered from
UPDATE order_items SET section = COALESCE((SELECT section FROM items WHERE items.id = order_items.item_id), '');

CREATE INDEX IF NOT EXISTS orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS orders_phone ON orders(phone, created_at);
CREATE INDEX IF NOT EXISTS order_items_order ON order_items(order_id);

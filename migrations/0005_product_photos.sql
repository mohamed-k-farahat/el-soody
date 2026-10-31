-- Store photos per product (the first is the main one). The story book keeps using products.image.

ALTER TABLE products ADD COLUMN photos TEXT NOT NULL DEFAULT '[]';

UPDATE products SET photos = '["/media/products/arabica-1.webp","/media/products/arabica-2.webp"]' WHERE slug = 'arabica';
UPDATE products SET photos = '["/media/products/habashi.webp"]' WHERE slug = 'habashi';
UPDATE products SET photos = '["/media/products/nescafe-gold-1.webp","/media/products/nescafe-gold-2.webp"]' WHERE slug = 'nescafe-gold';
UPDATE products SET photos = '["/media/products/special.webp"]' WHERE slug = 'special';
UPDATE products SET photos = '["/media/products/arabi.webp"]' WHERE slug = 'arabi';
UPDATE products SET photos = '["/media/products/espresso.webp"]' WHERE slug = 'espresso';
UPDATE products SET photos = '["/media/products/saudi.webp"]' WHERE slug = 'saudi';
UPDATE products SET photos = '["/media/products/colombi-1.webp","/media/products/colombi-2.webp"]' WHERE slug = 'colombi';
UPDATE products SET photos = '["/media/products/brazili.webp"]' WHERE slug = 'brazili';
UPDATE products SET photos = '["/media/products/french-1.webp","/media/products/french-hazelnut-1.webp","/media/products/french-hazelnut-2.webp"]' WHERE slug = 'french';

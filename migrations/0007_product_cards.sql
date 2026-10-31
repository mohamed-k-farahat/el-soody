-- One store image design for every product (scripts/product-card): the shop's "كل فنجان ليه حكاية"
-- poster with each product's name. Seasonal posters (Ramadan, summer) can be swapped in later from admin.
UPDATE products SET photos = '["/media/products/card-' || slug || '.webp"]'
WHERE slug IN ('habashi', 'brazili', 'colombi', 'hindi', 'arabi', 'saudi', 'malaki', 'special', 'arabica',
               'espresso', 'green', 'french', 'nescafe-black', 'nescafe-gold', 'coffee-mix', 'coffee-shop');

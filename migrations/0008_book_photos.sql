-- The story book shows a branded photo for each coffee (scripts/book-plates) instead of the bean drawing.
-- Admin can still replace any of them from the product page.
UPDATE products SET image = '/media/book/' || slug || '.webp'
WHERE slug IN ('habashi', 'brazili', 'colombi', 'hindi', 'arabi', 'saudi', 'malaki', 'special',
               'arabica', 'espresso', 'green', 'french');

// Product images are either files shipped with the site ("/media/...") or photos uploaded in admin,
// stored in Cloudflare KV as "r2:<key>" and served by /img/<key>.
export const imageUrl = (image) => {
  if (!image) return '/media/bags.jpg';
  return image.startsWith('r2:') ? `/img/${image.slice(3)}` : image;
};

/** What the store shows for a product: its store photos, or the bean drawing when it has none */
export const storePhotos = (p) => (p.photos?.length ? p.photos : [p.image || '']);

/** Bean drawings sit on a light card; photos fill it */
export const isPhoto = (image) => !String(image || '').startsWith('/media/beans/');

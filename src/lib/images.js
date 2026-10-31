// Product images are either files shipped with the site ("/media/...") or photos uploaded in admin,
// stored in R2 as "r2:<key>" and served by /img/<key>.
export const imageUrl = (image) => {
  if (!image) return '/media/bags.jpg';
  return image.startsWith('r2:') ? `/img/${image.slice(3)}` : image;
};

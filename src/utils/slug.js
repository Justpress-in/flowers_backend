function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function randomId(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 10);
}

module.exports = { slugify, randomId };

const Blog = require('../models/Blog');
const asyncHandler = require('../utils/asyncHandler');
const { slugify, randomId } = require('../utils/slug');

function shape(b) {
  if (!b) return null;
  const obj = b.toJSON ? b.toJSON() : b;
  return {
    id: obj.slug,
    title: obj.title,
    excerpt: obj.excerpt || '',
    body: obj.body,
    coverImage: obj.coverImage || '',
    author: obj.author || 'BloomNest',
    tags: obj.tags || [],
    category: obj.category || 'General',
    readingTimeMin: obj.readingTimeMin || 5,
    published: !!obj.published,
    publishedAt: obj.publishedAt,
    views: obj.views || 0,
    createdAt: obj.createdAt,
  };
}

async function uniqueSlug(base) {
  let slug = slugify(base) || 'post-' + randomId();
  let i = 1;
  while (await Blog.exists({ slug })) {
    slug = `${slugify(base)}-${i++}`;
    if (i > 50) { slug = 'post-' + randomId(); break; }
  }
  return slug;
}

function estimateReadingTime(body) {
  const words = (body || '').trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.published === 'true') filter.published = true;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.tag) filter.tags = req.query.tag;
  const blogs = await Blog.find(filter).sort({ publishedAt: -1 });
  res.json(blogs.map(shape));
});

exports.getBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.id });
  if (!blog) return res.status(404).json({ message: 'Post not found' });
  // increment views asynchronously
  if (req.query.track !== 'false') {
    Blog.updateOne({ _id: blog._id }, { $inc: { views: 1 } }).catch(() => {});
  }
  res.json(shape(blog));
});

exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.title || !body.body) {
    return res.status(400).json({ message: 'Title and body are required' });
  }
  const slug = body.id ? slugify(body.id) : await uniqueSlug(body.title);
  const blog = await Blog.create({
    slug,
    title: body.title,
    excerpt: body.excerpt || '',
    body: body.body,
    coverImage: body.coverImage || '',
    author: body.author || 'BloomNest',
    tags: body.tags || [],
    category: body.category || 'General',
    readingTimeMin: body.readingTimeMin || estimateReadingTime(body.body),
    published: body.published !== false,
    publishedAt: body.publishedAt || new Date(),
  });
  res.status(201).json(shape(blog));
});

exports.update = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.id });
  if (!blog) return res.status(404).json({ message: 'Post not found' });
  const body = req.body || {};
  const fields = ['title', 'excerpt', 'body', 'coverImage', 'author', 'tags', 'category', 'published', 'publishedAt'];
  for (const f of fields) if (body[f] !== undefined) blog[f] = body[f];
  if (body.body !== undefined) blog.readingTimeMin = estimateReadingTime(body.body);
  if (body.readingTimeMin !== undefined) blog.readingTimeMin = body.readingTimeMin;
  await blog.save();
  res.json(shape(blog));
});

exports.remove = asyncHandler(async (req, res) => {
  const blog = await Blog.findOneAndDelete({ slug: req.params.id });
  if (!blog) return res.status(404).json({ message: 'Post not found' });
  res.json({ message: 'Post deleted', id: req.params.id });
});

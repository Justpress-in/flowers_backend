const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, default: '' },
    body: { type: String, required: true },
    coverImage: { type: String, default: '' },
    author: { type: String, default: 'BloomNest' },
    tags: { type: [String], default: [] },
    category: { type: String, default: 'General' },
    readingTimeMin: { type: Number, default: 5 },
    published: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
    views: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

blogSchema.virtual('id').get(function () {
  return this.slug;
});

blogSchema.index({ published: 1, publishedAt: -1 });

module.exports = mongoose.model('Blog', blogSchema);

const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    cta: { type: String, default: '' },
    ctaLink: { type: String, default: '' },
    bg: { type: String, default: '' },
    image: { type: String, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

bannerSchema.virtual('id').get(function () {
  return this.slug;
});

module.exports = mongoose.model('Banner', bannerSchema);

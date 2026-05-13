const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'site', unique: true },
    siteName: { type: String, default: 'BloomNest' },
    tagline: { type: String, default: 'Flowers, Gifts & Unforgettable Events' },
    description: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    contactAddress: { type: String, default: '' },
    whatsappNumber: { type: String, default: '' },
    social: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      youtube: { type: String, default: '' },
      pinterest: { type: String, default: '' },
    },
    hero: {
      title: { type: String, default: '' },
      subtitle: { type: String, default: '' },
      ctaPrimary: { type: String, default: 'Shop Flowers' },
      ctaPrimaryLink: { type: String, default: '/flowers' },
      ctaSecondary: { type: String, default: 'Browse Gifts' },
      ctaSecondaryLink: { type: String, default: '/gifts' },
    },
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      keywords: { type: [String], default: [] },
    },
    currency: { type: String, default: 'USD' },
    currencySymbol: { type: String, default: '$' },
    shippingNote: { type: String, default: 'Free delivery for orders over $50' },
    footerCopy: { type: String, default: '' },
  },
  { timestamps: true }
);

settingsSchema.statics.get = async function () {
  let doc = await this.findOne({ key: 'site' });
  if (!doc) doc = await this.create({ key: 'site' });
  return doc;
};

module.exports = mongoose.model('Settings', settingsSchema);

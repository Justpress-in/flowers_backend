const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '' },
    image: { type: String, default: '' },
    badge: { type: String, default: '' },
    link: { type: String, default: '' },
    couponCode: { type: String, default: '' },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

offerSchema.virtual('id').get(function () {
  return this.slug;
});

module.exports = mongoose.model('Offer', offerSchema);

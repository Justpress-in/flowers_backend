const mongoose = require('mongoose');

const priceTierSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    // Inclusive bounds. Either may be null/undefined to mean "no bound".
    minPrice: { type: Number, default: null },
    maxPrice: { type: Number, default: null },
    currencySymbol: { type: String, default: '$' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

priceTierSchema.virtual('id').get(function () {
  return this.slug;
});

module.exports = mongoose.model('PriceTier', priceTierSchema);

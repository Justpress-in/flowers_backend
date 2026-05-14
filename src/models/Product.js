const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    storeId: { type: String, required: true },
    // Effective selling price (kept for back-compat; mirrors offeredPrice when both set).
    price: { type: Number, required: true, min: 0 },
    // Internal cost / wholesale price — what we pay to acquire the stock.
    stockPrice: { type: Number, default: 0, min: 0 },
    // Sticker / MRP shown struck-through when a discount is active.
    basePrice: { type: Number, default: 0, min: 0 },
    // What the customer actually pays.
    offeredPrice: { type: Number, default: 0, min: 0 },
    // 0–100; flat discount alternative supported via offeredPrice directly.
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['flowers', 'gifts', 'parties'],
      required: true,
    },
    type: { type: String, enum: ['natural', 'artificial'], default: 'natural' },
    description: { type: String, required: true },
    image: { type: String, default: '' },
    images: { type: [String], default: [] },
    sizes: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    availableColors: { type: [String], default: [] },
    allowCustomDescription: { type: Boolean, default: true },
    storeInventory: { type: [inventorySchema], default: [] },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual('id').get(function () {
  return this.slug;
});

productSchema.index({ category: 1 });
productSchema.index({ tags: 1 });

module.exports = mongoose.model('Product', productSchema);

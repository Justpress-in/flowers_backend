const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    storeId: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
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

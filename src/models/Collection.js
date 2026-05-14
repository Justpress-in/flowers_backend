const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    // showstopper = "The Showstopper Collection" tile
    // pair        = "Pair With Flowers" tile (e.g. flowers + cake)
    kind: { type: String, enum: ['showstopper', 'pair'], required: true, index: true },
    // Product slugs that belong in this collection.
    productIds: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

collectionSchema.virtual('id').get(function () {
  return this.slug;
});

module.exports = mongoose.model('Collection', collectionSchema);

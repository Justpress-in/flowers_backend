const mongoose = require('mongoose');

const citySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    icon: { type: String, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

citySchema.virtual('id').get(function () {
  return this.slug;
});

module.exports = mongoose.model('City', citySchema);

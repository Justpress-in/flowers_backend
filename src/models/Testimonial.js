const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    location: { type: String, default: '' },
    avatar: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    quote: { type: String, required: true },
    occasion: { type: String, default: '' },
    productId: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

testimonialSchema.virtual('id').get(function () {
  return this._id.toString();
});

module.exports = mongoose.model('Testimonial', testimonialSchema);

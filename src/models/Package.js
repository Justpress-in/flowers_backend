const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    eventType: {
      type: String,
      enum: ['wedding', 'birthday', 'corporate', 'anniversary', 'baby-shower', 'other'],
      default: 'wedding',
    },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    gallery: { type: [String], default: [] },
    inclusions: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    duration: { type: String, default: '' },
    capacity: { type: String, default: '' },
    tags: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

packageSchema.virtual('id').get(function () {
  return this.slug;
});

packageSchema.index({ eventType: 1, active: 1 });

module.exports = mongoose.model('Package', packageSchema);

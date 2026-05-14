const mongoose = require('mongoose');

const homeColourSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    // Optional CSS swatch — useful if no image is provided.
    swatch: { type: String, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

homeColourSchema.virtual('id').get(function () {
  return this.slug;
});

module.exports = mongoose.model('HomeColour', homeColourSchema);

const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    logo: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    serviceAreas: { type: [String], default: [] },
    trackingUrlTemplate: { type: String, default: '' }, // e.g. https://x.com/track/{id}
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

partnerSchema.virtual('id').get(function () {
  return this.slug;
});

module.exports = mongoose.model('DeliveryPartner', partnerSchema);

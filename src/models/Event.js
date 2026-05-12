const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    packageType: {
      type: String,
      enum: ['wedding', 'birthday', 'corporate', 'anniversary', 'other'],
      default: 'wedding',
    },
    venue: { type: String, required: true, trim: true },
    date: { type: Date, default: null },
    capacity: { type: Number, default: 0 },
    description: { type: String, default: '' },
    price: { type: Number, default: 0 },
    contactName: { type: String, default: '' },
    contactPhone: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['enquiry', 'confirmed', 'in-progress', 'completed', 'cancelled'],
      default: 'enquiry',
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

eventSchema.virtual('id').get(function () {
  return this.slug;
});

module.exports = mongoose.model('Event', eventSchema);

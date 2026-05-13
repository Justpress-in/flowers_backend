const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String, default: '' },
    storeId: { type: String, default: '' },
    storeName: { type: String, default: '' },
    serviceType: {
      type: String,
      enum: ['consultation', 'event-planning', 'workshop', 'tasting', 'other'],
      default: 'consultation',
    },
    occasion: { type: String, default: '' },
    notes: { type: String, default: '' },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, default: '' },
    durationMin: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ['requested', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
      default: 'requested',
    },
    adminNotes: { type: String, default: '' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

bookingSchema.virtual('id').get(function () {
  return this.bookingId;
});

module.exports = mongoose.model('Booking', bookingSchema);

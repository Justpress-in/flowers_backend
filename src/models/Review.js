const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '' },
    body: { type: String, required: true, trim: true },
    images: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    helpfulCount: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

reviewSchema.virtual('id').get(function () {
  return this._id.toString();
});

module.exports = mongoose.model('Review', reviewSchema);

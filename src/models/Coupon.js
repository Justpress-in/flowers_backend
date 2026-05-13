const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['percent', 'flat'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: 0, min: 0 }, // 0 = no cap
    usageLimit: { type: Number, default: 0, min: 0 },  // 0 = unlimited
    perUserLimit: { type: Number, default: 0, min: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

couponSchema.index({ active: 1, expiresAt: 1 });

couponSchema.virtual('id').get(function () {
  return this._id.toString();
});

couponSchema.methods.calcDiscount = function (subtotal) {
  if (this.type === 'percent') {
    let d = (subtotal * this.value) / 100;
    if (this.maxDiscount > 0) d = Math.min(d, this.maxDiscount);
    return Math.round(d * 100) / 100;
  }
  return Math.min(this.value, subtotal);
};

module.exports = mongoose.model('Coupon', couponSchema);

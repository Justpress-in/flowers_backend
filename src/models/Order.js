const mongoose = require('mongoose');

const giftSchema = new mongoose.Schema(
  {
    receiverName: String,
    receiverPhone: String,
    receiverAddress: String,
    giftMessage: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    storeId: { type: String, required: true },
    storeName: { type: String, required: true },
    type: { type: String, enum: ['personal', 'gift'], required: true },
    color: { type: String, default: '' },
    size: { type: String, default: '' },
    customDescription: { type: String, default: '' },
    giftDetails: { type: giftSchema, default: null },
    price: { type: Number, required: true, min: 0 },
    customerName: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Confirmed',
    },
    trackingUrl: { type: String, default: '' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

orderSchema.virtual('id').get(function () {
  return this.orderId;
});

module.exports = mongoose.model('Order', orderSchema);

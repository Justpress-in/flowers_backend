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
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    productImage: { type: String, default: '' },
    storeId: { type: String, required: true },
    storeName: { type: String, required: true },
    type: { type: String, enum: ['personal', 'gift'], required: true },
    color: { type: String, default: '' },
    size: { type: String, default: '' },
    quantity: { type: Number, default: 1, min: 1 },
    customDescription: { type: String, default: '' },
    giftDetails: { type: giftSchema, default: null },
    unitPrice: { type: Number, default: 0, min: 0 },
    price: { type: Number, required: true, min: 0 },
    couponCode: { type: String, default: '' },
    discount: { type: Number, default: 0, min: 0 },
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

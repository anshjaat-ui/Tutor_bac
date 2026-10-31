import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  image: String,
  price: Number,
  qty: Number,
  size: String,
})

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      lat: Number,
      lng: Number,
    },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true, default: 0 },
    couponCode: String,
    discountAmount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },

    // Payment - Indian local methods only: qr, upi, cod
    paymentMethod: { type: String, enum: ['qr', 'upi', 'cod'], required: true },
    upiRef: String, // customer ne jo UTR/reference number diya
    paymentClaimed: { type: Boolean, default: false }, // customer bola "maine pay kar diya" (qr/upi ke liye)
    isPaid: { type: Boolean, default: false }, // admin ne verify kiya (qr/upi), ya COD delivered pe true hota hai
    paidAt: Date,

    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
)

export default mongoose.model('Order', orderSchema)

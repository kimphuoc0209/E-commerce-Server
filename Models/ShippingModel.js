import mongoose from "mongoose";

const ShippingSchema = mongoose.Schema({
  shipper: {
    type: mongoose.Schema.Types.ObjectId,
    require: true,
    ref: "User",
  },
  orders: [
    {
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    },
  ],
});

const Shipping = mongoose.model("Shipping", ShippingSchema);

export default Shipping;

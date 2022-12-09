import mongoose from "mongoose";

const ShippingSchema = mongoose.Schema({
  shipper: {
    type: mongoose.Schema.Types.ObjectId,
    require: true,
    ref: "User",
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  pickedAt: {
    type: Date,
  },
});

const Shipping = mongoose.model("Shipping", ShippingSchema);

export default Shipping;

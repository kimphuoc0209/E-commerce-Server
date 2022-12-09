import express from "express";
import asyncHandler from "express-async-handler";
import { now } from "mongoose";
import { protect, shipper } from "../Middleware/AuthMiddleware.js";
import Order from "../Models/OrderModel.js";
import Shipping from "../Models/ShippingModel.js";
import User from "../Models/UserModel.js";

const shipperRoute = express.Router();

//Main page
shipperRoute.get(
  "/",
  protect,
  shipper,

  asyncHandler(async (req, res) => {
    const orders = await Order.find({ isVerified: true })
      .sort({ _id: -1 })
      .populate("user", "id name email");
    res.json(orders);
  })
);

//Update picking status
shipperRoute.put(
  "/:id/isPicked",
  protect,
  shipper,

  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isPicked = true;
      const newShipping = new Shipping({
        shipper: req.user._id,
        order: req.params.id,
        pickedAt: Date.now(),
      });
      await newShipping.save();
      await order.save();
      console.log(order);
      res.json(newShipping);
    }
  })
);

//Update delivered status
shipperRoute.put(
  "/:id/delivered",
  protect,
  shipper,

  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    const shipping = await Shipping.find({
      orderId: req.params.id,
    });
    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(400).send({
        message: "Order not found",
      });
    }
  })
);

export default shipperRoute;

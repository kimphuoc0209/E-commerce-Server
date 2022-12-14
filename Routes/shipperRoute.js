import express from "express";
import asyncHandler from "express-async-handler";
import { now } from "mongoose";
import { protect, shipper } from "../Middleware/AuthMiddleware.js";
import Order from "../Models/OrderModel.js";
import Shipping from "../Models/ShippingModel.js";
import User from "../Models/UserModel.js";

const shipperRoute = express.Router();

//Main page - Get verified order
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

//Confirm shipping the order
shipperRoute.put(
  "/:id/confirm",
  protect,
  shipper,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.confirmShipping = true;
      const shippingRecord = await Shipping.findOne({
        shipper: req.user._id,
      });
      if (shippingRecord) {
        const newShipping = {
          orderId: req.params.id,
          name: order.user.name,
          isPaid: order.isPaid,
          totalPrice: order.totalPrice,
        };

        shippingRecord.orders.push(newShipping);
        await shippingRecord.save();
        await order.save();

        res.json(shippingRecord);
      } else {
        const newShipping = new Shipping({
          shipper: req.user._id,
          orders: [
            {
              orderId: req.params.id,
              name: order.user.name,
              isPaid: order.isPaid,
              totalPrice: order.totalPrice,
            },
          ],
        });
        await newShipping.save();
        await order.save();
        res.json(newShipping);
      }
    } else {
      res.status(400).send({
        message: "Order not found",
      });
    }
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
      order.pickedAt = Date.now();

      await order.save();
    }
    res.json(order);
  })
);

//Update delivered status
shipperRoute.put(
  "/:id/delivered",
  protect,
  shipper,

  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    const shipping = await Shipping.findOne({
      shipper: req.user._id,
    });
    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      if (order.paymentMethod === "COD") {
        order.isPaid = true;
        order.paidAt = Date.now();
      }
      shipping.deliveredAt = Date.now();
      const updatedOrder = await order.save();
      const updatedShipping = await shipping.save();
      console.log(updatedShipping);
      res.json(updatedOrder);
    } else {
      res.status(400).send({
        message: "Order not found",
      });
    }
  })
);

//Start delivering order
shipperRoute.put(
  "/:id/shipping",
  protect,
  shipper,

  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isShipping = true;

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(400).send({
        message: "Order not found",
      });
    }
  })
);

//Get order has been delivered by shipper
shipperRoute.get(
  "/orders",
  protect,
  shipper,
  asyncHandler(async (req, res) => {
    const shipperDeliveredOrder = await Shipping.findOne({
      shipper: req.user._id,
    });
    console.log(shipperDeliveredOrder);
    if (shipperDeliveredOrder) {
      res.json(shipperDeliveredOrder.orders);
    } else {
      res.status(401).send({
        message: "No orders",
      });
    }
  })
);

export default shipperRoute;

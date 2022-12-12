import express from "express";
import asyncHandler from "express-async-handler";
import { protect, admin } from "../Middleware/AuthMiddleware.js";
import Order from "../Models/OrderModel.js";

const orderRouter = express.Router();

// Create Order
orderRouter.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;
    if (orderItems && orderItems.length === 0) {
      res.status(400);
      throw new Error("No order items");
    } else {
      const order = new Order({
        orderItems,
        user: req.user._id,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      });

      const createOrder = await order.save();
      res.status(201).json(createOrder);
    }
  })
);

// //User login orders
// orderRouter.get(
//   "/",
//   protect,
//   asyncHandler(async (req, res) => {
//     const order = await Order.find({
//       user: req.user._id,
//     }).sort({ _id: -1 });
//     res.json(order);
//   })
// );

// Admin get all orders
orderRouter.get(
  "/all",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    // const pageSize = 8;
    // const page = Number(req.query.pageNumber) || 1;

    // const count = await Order.countDocuments({});

    // const orders = await Order.find({});
    // // .limit(pageSize)
    // // .skip(pageSize * (page - 1))
    // // .sort({ _id: -1 });
    // // res.json({ orders, page, pages: Math.ceil(count / pageSize) });
    // res.json(orders);

    const orders = await Order.find({})
      .sort({ _id: -1 })
      .populate("user", "id name email");
    res.json(orders);
  })
);

// Get Order by Id
orderRouter.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );
    if (order) {
      res.json(order);
    } else {
      res.status(400).send({
        message: "Order not found",
      });
    }
  })
);

// User Login Orders
orderRouter.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.find({ user: req.user._id }).sort({ _id: -1 });
    if (order.length == 0) {
      res.status(404).send({
        message: "No order found",
      });
    } else {
      res.json(order);
    }
  })
);

//Order is Paid
orderRouter.put(
  "/:id/pay",
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(400).send({
        message: "Order not found",
      });
    }
  })
);

//Order has been confirm
orderRouter.put(
  "/:id/verified",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isVerified = true;
      order.verifiedAt = Date.now();
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(400).send({
        message: "Order not found",
      });
    }
  })
);

// //Order is Deliver
// orderRouter.put(
//   "/:id/delivered",
//   protect,
//   asyncHandler(async (req, res) => {
//     const order = await Order.findById(req.params.id);
//     if (order) {
//       order.isDelivered = true;
//       order.deliveredAt = Date.now();

//       const updatedOrder = await order.save();
//       res.json(updatedOrder);
//     } else {
//       res.status(400).send({
//         message: "Order not found",
//       });
//     }
//   })
// );

export default orderRouter;

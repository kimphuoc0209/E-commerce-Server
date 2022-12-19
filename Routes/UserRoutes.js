import express, { Router } from "express";
import asyncHandler from "express-async-handler";
import { protect, admin } from "../Middleware/AuthMiddleware.js";
import nodemailer from "nodemailer";
import User from "../Models/UserModel.js";
import generateToken from "../utils/generateToken.js";
import dotenv from "dotenv";
import { uuid } from "uuidv4";
import bcrypt from "bcryptjs";
import * as path from "path";
import { fileURLToPath } from "url";
import userVerification from "../Models/UserVerificationModel.js";
dotenv.config();
const userRoute = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
//Add nodemailer
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

//testing nodemailer
transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log();

    console.log("Ready to transfer");
    console.log(success);
  }
});

//Verification Email func
const sendVerificationEmail = asyncHandler(async ({ _id, email }, res) => {
  //url to be used in the email
  const currentUrl = "http://localhost:5000/";
  const uniqueString = uuid() + _id;
  // mail options
  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Verify Your Email",
    html: `<p>Verify your email address to complete the signup and login into your account.</p><p>This link 
    <b>expires in 1 hours</b>.</p>
    <p>Press <a href=${
      currentUrl + "api/users/verified/" + _id + "/" + uniqueString
    }>here</a> to proceed.</p>`,
  };

  // hash the uniqueString
  const hashedUniqueString = await bcrypt.hash(uniqueString, 10);
  if (hashedUniqueString) {
    const newVerification = new userVerification({
      userId: _id,
      uniqueString: hashedUniqueString,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });
    await newVerification.save();
    const sendMail = await transporter.sendMail(mailOptions);
    if (sendMail) {
      res.json({
        status: "PENDING",
        message: "Verification email sent",
      });
    } else {
      res.json({
        status: "Error",
        message: "Can not send verification email",
      });
    }
  }
});

//Login
userRoute.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password)) && user.isVerified) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
        isVerified: user.isVerified,
        isShipper: user.isShipper,
        createdAt: user.createdAt,
      });
    } else if (user && !user.isVerified) {
      res.status(401).json({ message: "User has not been verified" });
      // throw new Error("Invalid Email or Password");
    }
     else {
      res.status(401).json({ message: "Invalid Email or Password" });
      // throw new Error("Invalid Email or Password");
    }
  })
);

//Email verify
userRoute.get(
  "/verified/:userId/:uniqueString",
  asyncHandler(async (req, res) => {
    let { userId, uniqueString } = req.params;

    const verifyUser = await userVerification.find({ userId });
    if (verifyUser) {
      if (verifyUser.length > 0) {
        //User verification exists so we proceed
        const { expiresAt } = verifyUser[0];
        const hashedUniqueString = verifyUser[0].uniqueString;

        const user = await User.findById(userId);

        //check for expires unique string
        if (expiresAt < Date.now()) {
          //record has expires
          const deleteUserVerificationRecord = await userVerification.deleteOne(
            {
              userId: userId,
            }
          );

          console.log(deleteUserVerificationRecord);

          if (deleteUserVerificationRecord) {
            if (user) {
              await user.remove();
              let message = "Link has expired. Please sign up again";
              res.redirect(`/api/users/verified/error=true&message=${message}`);
            } else {
              let message = "Clearing user with expired unique string failed";
              res.redirect(`/api/users/verified/error=true&message=${message}`);
            }
          } else {
            let message =
              "Error occurred while clearing expired user verification record";
            res.redirect(`/api/users/verified/error=true&message=${message}`);
          }
        } else {
          // record is exist -> validate the user string
          // First compare the hashed unique string

          const uniqueStringCompare = await bcrypt.compare(
            uniqueString,
            hashedUniqueString
          );
          console.log(uniqueStringCompare);
          if (uniqueStringCompare) {
            const deleteUserVerificationRecord =
              await userVerification.deleteOne({
                userId: userId,
              });
            console.log(deleteUserVerificationRecord);

            if (user) {
              user.isVerified = true;
              await user.save();

              // res.send({
              //   status: "Success",
              //   message: "Email has been verified",
              // });
              res.sendFile(path.join(__dirname, "./../views/verified.html"));
            }
          } else {
            let message =
              "Invalid verification detail passed. Check your inbox.";
            res.redirect(`/api/users/verified/error=true&message=${message}`);
          }
        }
      } else {
        //User verification exists so we proceed
        let message =
          "Account record doesn't exist or has been verified already. Please sign up or log in.";
        res.redirect(`/api/users/verified/error=true&message=${message}`);
      }
    } else {
      let message =
        "An error occurred while checking for existing user verification record";
      res.redirect(`/api/users/verified/error=true&message=${message}`);
    }
  })
);

//Verified page route
userRoute.get("/verified", (req, res) => {
  res.sendFile(path.join(__dirname, "./../views/verified.html"));
});

//Register as shipper
userRoute.post(
  "/shipper",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).send({
        message: "User already exits",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      isShipper: true,
    });
    await sendVerificationEmail(user, res);
  })
);

//Register
userRoute.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).send({
        message: "User already exits",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });
    await sendVerificationEmail(user, res);

    // if (user) {
    //   res.status(201).json({
    //     _id: user._id,
    //     name: user.name,
    //     email: user.email,
    //     isAdmin: user.isAdmin,
    //     token: generateToken(user._id),
    //     isVerified: user.isVerified,
    //   });
    // } else {
    //   res.status(400).send({ message: "Invalid User Data" });
    // }
  })
);

//Profile
userRoute.get(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      });
    } else {
      res.status(401).send({
        message: "Invalid Email or Password",
      });
    }
  })
);

//Update Profile
userRoute.put(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name;
      user.email = req.body.email;
      if (req.body.password) {
        user.password = req.body.password;
      }
      const updateUser = await user.save();
      res.json({
        id: updateUser._id,
        name: updateUser.name,
        email: updateUser.email,
        isAdmin: updateUser.isAdmin,
        createdAt: updateUser.createdAt,
        token: generateToken(updateUser._id),
      });
    } else {
      res.status(404).send({
        message: "User not found",
      });
    }
  })
);

//Get all user admin
userRoute.get(
  "/",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const users = await User.find({});

    res.json(users);
  })
);

//Delete user
userRoute.delete(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    console.log(user);
    if (user && !user.isAdmin) {
      await user.remove();
      res.json({
        message: "User Deleted",
      });
    } else {
      res.status(404).send({
        message: "User not found",
      });
    }
  })
);

export default userRoute;

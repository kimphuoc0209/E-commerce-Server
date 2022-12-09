import bcrypt from "bcryptjs";
const users = [
  {
    name: "Admin",
    email: "admin@example.com",
    password: bcrypt.hashSync("123456", 10),
    isAdmin: true,
    isVerified: true,
    isShipper: false,
  },
  {
    name: "User",
    email: "user@example.com",
    password: bcrypt.hashSync("123456", 10),
    isVerified: true,
    isShipper: false,
  },
  {
    name: "Shipper",
    email: "shipper@example.com",
    password: bcrypt.hashSync("123456", 10),
    isVerified: true,
    isShipper: true,
  },
];

export default users;

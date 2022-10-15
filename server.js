import express from "express";
import dotenv from "dotenv";
import connectDatabase from "./config/MongoDb.js";
import ImportData from "./DataImport.js";
import productRoute from "./Routes/ProductRoutes.js";
import userRoute from "./Routes/UserRoutes.js";

dotenv.config();
connectDatabase();
const app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/import", ImportData);
app.use("/api/products", productRoute);
app.use("/api/users", userRoute);
const PORT = process.env.PORT || 1000;

app.listen(PORT, console.log(`Server running on http://localhost:${PORT}`));

const express = require("express");
const body_parser = require("body-parser");
require("dotenv").config();
const cors = require("cors");

const messageRouter = require("./routes/message-routes"); // ✅

const app = express();

// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL, // your React/Vite frontend port
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );

app.use(body_parser.json());

app.use("/webhook", messageRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server Running at http://localhost:${PORT}`);
});

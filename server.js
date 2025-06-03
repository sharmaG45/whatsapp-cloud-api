const express = require("express");
const body_parser = require("body-parser");
require("dotenv").config();
const cors = require("cors");

const messageRouter = require("./routes/message-routes"); // ✅

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.use(body_parser.json());

app.use("/webhook", messageRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server Running at http://localhost:${PORT}`);
});

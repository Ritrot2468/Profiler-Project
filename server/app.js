// server/app.js
const express = require("express");
const cors = require("cors");
const router = require("./routes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// CORS pre-flight
app.options("*", cors());

// Mount routes
app.use("/", router);

module.exports = app;

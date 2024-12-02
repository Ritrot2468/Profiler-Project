// index.js
const express = require("express");
const cors = require("cors");
const config = require("./config");
const router = require("./routes");

config.validateConfig();

const app = express();
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
}));

app.use('/', router);

app.listen(config.PORT, () => {
    console.log(`Server is running on http://localhost:${config.PORT}`);
});
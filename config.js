// config.js
const dotenv = require("dotenv");

dotenv.config();

module.exports = {
    PORT: process.env.PORT || 5000,
    API_KEY: process.env.GOOGLE_API_KEY,
    SEARCH_ENGINE_ID: process.env.SEARCH_ENGINE_ID,
    BACKEND_URL: process.env.BACKEND_URL,

    validateConfig: function() {
        if (!this.API_KEY || !this.SEARCH_ENGINE_ID || !this.BACKEND_URL) {
            console.error("Missing required environment variables.");
            process.exit(1);
        }
    }
};
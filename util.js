// utils.js
const xlsx = require("xlsx");

// Utility function for saving data to Excel
const saveToExcel = (data, outputPath) => {
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Search Results");
    xlsx.writeFile(workbook, outputPath);
    console.log(`Data saved to ${outputPath}`);
};

// Utility function to calculate funding score
const calculateFundingScore = (fundingAmount) => {
    if (fundingAmount > 100_000_000) {
        return 10;
    } else if (fundingAmount >= 10_000_000 && fundingAmount <= 100_000_000) {
        return 5;
    } else {
        return 0;
    }
};

module.exports = {
    saveToExcel,
    calculateFundingScore,
};
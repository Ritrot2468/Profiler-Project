
class FundingParser {

    //TODO: need to make more dynamic for changing currency rates
    static CURRENCY_RATES = { "£": 1.22, "€": 1.08, "¥": 0.0077 };
    static CURRENCY_SYMBOLS = { USD: "$", GBP: "£", EUR: "€" };


    /**
     * Class concerned with parsing and normalizing funding information from Google Search fetches and parses Google Custom Search API response
     */
    static extractAll(response) {
        if (!response) {
            console.error("Invalid response format.");
            return [];
        }
    
        return response.map(this.extractFundingDetails).filter(Boolean);
    }


        /**
     * Extracts funding details from a search result
     * @param {Object} result - Individual search result
     * @param {RegExp} regex - Regular expression for finding funding amounts
     * @returns {Object|null} Parsed funding details or null if none found
     */
    static extractFundingDetails(result) {
        const { Title, Link, Snippet, PageMap } = result;
        const content = [Title, Snippet, PageMap?.metatags?.[0]?.["og:description"]]
            .filter(Boolean)
            .join(" ");
            const fundingRegex = /([$£€¥]|USD|GBP|EUR)\s?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)[\s-]*(\b(million|billion|thousand|mn|bn|M|B|k|K)\b)/gi;
            const matches = [...content.matchAll(fundingRegex)];
            
            if (matches.length === 0) return null;
        
            let maxFunding = 0;
            let bestMatch = null;
    
        for (const match of matches) {
            try {
                const [_, currency, amount, , multiplier] = match;
                const funding = FundingParser.normalizeFundingAmount(amount, multiplier, currency);
                
                if (funding > maxFunding) {
                    maxFunding = funding;
                    bestMatch = { 
                        Title, 
                        Link, 
                        Snippet, 
                        FundingAmount: funding,
                        Currency: currency.replace(/USD|GBP|EUR/, match => CURRENCY_SYMBOLS[match] || match)
                    };
                }
            } catch (e) {
                console.error('Error processing funding:', e);
            }
        }
    
        return bestMatch;
        
    }


    /**
     * Normalizes a funding amount based on its multiplier
     * @param {string} amount - The amount before normalization
     * @param {string} multiplier - The multiplier (e.g., million, billion)
     * @returns {number} Normalized funding amount
     */
    static normalizeFundingAmount(amount, multiplier, currency) {
        const MULTIPLIERS = {
            thousand: 1e3,
            k: 1e3,
            million: 1e6,
            m: 1e6,
            mn: 1e6,
            billion: 1e9,
            b: 1e9,
            bn: 1e9
        };
        const cleanedAmount = parseFloat(amount.replace(/,/g, ''));
        const lowerMultiplier = multiplier.toLowerCase();
        const multiplierValue = MULTIPLIERS[lowerMultiplier] || 1;
        const currencySymbol = currency.replace(/[^$£€¥]/g, '');
        const conversionRate = CURRENCY_RATES[currencySymbol] || 1;
        
        return cleanedAmount * multiplierValue * conversionRate;
    }


    /**
     * Calculate the total funding amount from unique amounts.
     * @param {Set} uniqueFundingAmounts - Set of unique funding amounts
     * @returns {number} Total funding amount
     */
    static calculateTotalFunding(uniqueFundingAmounts) {
        const unique = new Set(uniqueFundingAmounts.map(f => parseFloat(f.FundingAmount)));
        return Array.from(unique).reduce((sum, amount) => sum + amount, 0);
    }
}
module.exports = FundingParser;
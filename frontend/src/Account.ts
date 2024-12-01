import * as fs from 'fs';
const dotenv = require("dotenv");
dotenv.config();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export type Account = {
    account_name: string;
    product_or_part_number: string;
    segment: string;
    funding_amount: number;
    product_score?: number;
    segment_score?: number;
    funding_score?: number;
    total_score?: number;
    priority?: string;
  };
  
 export type ProductScore = {
    product: string;
    part_number: string;
    product_score: number;
  };
  
  function calculateFundingScore(fundingAmount: number): number {
    if (fundingAmount > 100_000_000) {
      return 10;
    } else if (fundingAmount >= 10_000_000 && fundingAmount <= 100_000_000) {
      return 5;
    } else {
      return 0;
    }
  }
  
  const filePath = 'product_scores.json';
  const productScores: ProductScore[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
   // Segment score mapping
   const segmentScoreMap: Record<string, number> = {
    ACAD: 1,
    BTCH: 10,
    APPL: 2,
    DX: 10,
    HOSP: 2,
    REF: 10,
    "LIFE SCI": 2,
  };
 
  async function fetchFundingAmount(accountName: string): Promise<number> {
    try {
      const response = await fetch(`${BACKEND_URL}/search/${encodeURIComponent(accountName)}`);
      const data = await response.json();
      return data.sum || 0;
    } catch (error) {
      console.error(`Error fetching funding amount for ${accountName}:`, error);
      return 0;
    }
  }

  export async function fetchFundingData(accountName: string, productCode: string, acctSegment: string): Promise<any> {
    try {
      const response = await fetch(`${BACKEND_URL}/search/${encodeURIComponent(accountName)}?productCode=${encodeURIComponent(
          productCode
        )}&segment=${encodeURIComponent(acctSegment)}`);
      
      return response.json();
    } catch (error) {
      throw new Error(`Error fetching funding amount for ${accountName}:`);
    }
  }

  async function scoreAndUpdateAccounts(
    unclassifiedAccounts: Account[],
    productScores: ProductScore[]
  ): Promise<Account[]> {
    const updatedAccounts = await Promise.all(
      unclassifiedAccounts.map(async (account) => {
        // Lookup product score
        const productScore =
          productScores.find(
            (ps) =>
              ps.product === account.product_or_part_number ||
              ps.part_number === account.product_or_part_number
          )?.product_score || 0;
  
        // Lookup segment score
        const segmentScore = segmentScoreMap[account.segment] || 0;
  
        // Fetch funding amount and calculate funding score
        const fundingAmount = await fetchFundingAmount(account.account_name);
        const fundingScore = calculateFundingScore(fundingAmount);
  
        // Calculate total score and priority
        const totalScore = productScore + segmentScore + fundingScore;
        const priority = totalScore >= 12 ? "Multiple Contacts" : "Single Contact";
  
        return {
          ...account,
          product_score: productScore,
          segment_score: segmentScore,
          funding_score: fundingScore,
          total_score: totalScore,
          priority,
        };
      })
    );
  
    return updatedAccounts;
  }
    
  

  
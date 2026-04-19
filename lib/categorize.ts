// Local heuristic categorizer — fast fallback when Claude isn't available.
// Also used as a first pass before AI to cut API calls.

const RULES: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /swiggy|zomato|eatfit|fasoos|dominos|mcdonald|kfc|subway|pizza|burger|food|rest/i, category: "Food & Dining" },
  { pattern: /starbucks|chai|cafe|coffee|barista/i, category: "Food & Dining" },
  { pattern: /bigbasket|blinkit|zepto|grofers|dmart|reliance fresh|supermarket|grocery/i, category: "Groceries" },
  { pattern: /uber|ola|rapido|metro|irctc|railway|redbus|makemytrip|goibibo|flight|indigo|vistara|air india/i, category: "Transport" },
  { pattern: /petrol|hp |iocl|bpcl|diesel/i, category: "Transport" },
  { pattern: /amazon|flipkart|myntra|meesho|ajio|tatacliq|snapdeal|nykaa|lenskart/i, category: "Shopping" },
  { pattern: /netflix|prime|hotstar|spotify|youtube|gaana|jiosaavn|sony liv|bookmyshow/i, category: "Entertainment" },
  { pattern: /apollo|pharmeasy|medplus|1mg|cult|fitness|gym|healthifyme|practo/i, category: "Healthcare" },
  { pattern: /airtel|jio|vi |vodafone|bsnl|broadband|fiber|recharge/i, category: "Bills" },
  { pattern: /electric|power|gas|water|bill|utility|indane|hp gas/i, category: "Bills" },
  { pattern: /rent|nobroker|housing|landlord/i, category: "Rent" },
  { pattern: /salary|payroll|credit/i, category: "Salary" },
  { pattern: /sip|mutual fund|groww|zerodha|kuvera|upstox|smallcase|et money|axismf|hdfcmf/i, category: "Investments" },
  { pattern: /loan|emi|credit card|bill payment/i, category: "Loans & EMI" },
  { pattern: /donation|charity|temple|gurdwara|mosque|church/i, category: "Donations" },
  { pattern: /school|college|tuition|udemy|coursera|byju|unacademy/i, category: "Education" },
];

export function categorizeLocal(merchant: string): string {
  for (const rule of RULES) {
    if (rule.pattern.test(merchant)) return rule.category;
  }
  return "Other";
}

export function categorizeMany(rows: Array<{ merchant: string }>) {
  return rows.map((r) => categorizeLocal(r.merchant));
}

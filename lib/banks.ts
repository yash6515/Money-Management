import type { Bank } from "./types";

// Indicative FD rates as of early 2026 (admin editable). Senior rates +0.5% typical.
export const BANKS: Bank[] = [
  {
    id: "sbi",
    name: "State Bank of India",
    type: "psu",
    min_amount: 1000,
    featured: true,
    rates: [
      { tenure_months: 6, rate: 5.75, senior_rate: 6.25 },
      { tenure_months: 12, rate: 6.8, senior_rate: 7.3 },
      { tenure_months: 24, rate: 7.0, senior_rate: 7.5 },
      { tenure_months: 36, rate: 6.75, senior_rate: 7.25 },
      { tenure_months: 60, rate: 6.5, senior_rate: 7.5 },
    ],
  },
  {
    id: "hdfc",
    name: "HDFC Bank",
    type: "private",
    min_amount: 5000,
    featured: true,
    rates: [
      { tenure_months: 6, rate: 6.0, senior_rate: 6.5 },
      { tenure_months: 12, rate: 6.6, senior_rate: 7.1 },
      { tenure_months: 24, rate: 7.0, senior_rate: 7.5 },
      { tenure_months: 36, rate: 7.0, senior_rate: 7.5 },
      { tenure_months: 60, rate: 7.0, senior_rate: 7.5 },
    ],
  },
  {
    id: "icici",
    name: "ICICI Bank",
    type: "private",
    min_amount: 10000,
    featured: true,
    rates: [
      { tenure_months: 6, rate: 5.75, senior_rate: 6.25 },
      { tenure_months: 12, rate: 6.7, senior_rate: 7.2 },
      { tenure_months: 24, rate: 7.2, senior_rate: 7.7 },
      { tenure_months: 36, rate: 7.0, senior_rate: 7.5 },
      { tenure_months: 60, rate: 6.9, senior_rate: 7.4 },
    ],
  },
  {
    id: "axis",
    name: "Axis Bank",
    type: "private",
    min_amount: 5000,
    rates: [
      { tenure_months: 6, rate: 5.75, senior_rate: 6.25 },
      { tenure_months: 12, rate: 6.7, senior_rate: 7.2 },
      { tenure_months: 24, rate: 7.1, senior_rate: 7.6 },
      { tenure_months: 36, rate: 7.1, senior_rate: 7.6 },
      { tenure_months: 60, rate: 7.0, senior_rate: 7.75 },
    ],
  },
  {
    id: "kotak",
    name: "Kotak Mahindra Bank",
    type: "private",
    min_amount: 5000,
    rates: [
      { tenure_months: 6, rate: 6.0, senior_rate: 6.5 },
      { tenure_months: 12, rate: 6.75, senior_rate: 7.25 },
      { tenure_months: 24, rate: 7.15, senior_rate: 7.65 },
      { tenure_months: 36, rate: 7.0, senior_rate: 7.6 },
      { tenure_months: 60, rate: 6.2, senior_rate: 6.7 },
    ],
  },
  {
    id: "indusind",
    name: "IndusInd Bank",
    type: "private",
    min_amount: 10000,
    rates: [
      { tenure_months: 6, rate: 6.35, senior_rate: 6.85 },
      { tenure_months: 12, rate: 7.75, senior_rate: 8.25 },
      { tenure_months: 24, rate: 7.75, senior_rate: 8.25 },
      { tenure_months: 36, rate: 7.25, senior_rate: 7.75 },
      { tenure_months: 60, rate: 7.25, senior_rate: 7.75 },
    ],
  },
  {
    id: "yes",
    name: "Yes Bank",
    type: "private",
    min_amount: 10000,
    rates: [
      { tenure_months: 6, rate: 6.5, senior_rate: 7.0 },
      { tenure_months: 12, rate: 7.75, senior_rate: 8.25 },
      { tenure_months: 24, rate: 8.0, senior_rate: 8.5 },
      { tenure_months: 36, rate: 7.25, senior_rate: 8.0 },
      { tenure_months: 60, rate: 7.25, senior_rate: 8.0 },
    ],
  },
  {
    id: "pnb",
    name: "Punjab National Bank",
    type: "psu",
    min_amount: 1000,
    rates: [
      { tenure_months: 6, rate: 5.5, senior_rate: 6.0 },
      { tenure_months: 12, rate: 6.8, senior_rate: 7.3 },
      { tenure_months: 24, rate: 6.8, senior_rate: 7.3 },
      { tenure_months: 36, rate: 7.0, senior_rate: 7.5 },
      { tenure_months: 60, rate: 6.5, senior_rate: 7.3 },
    ],
  },
  {
    id: "bob",
    name: "Bank of Baroda",
    type: "psu",
    min_amount: 1000,
    rates: [
      { tenure_months: 6, rate: 5.75, senior_rate: 6.25 },
      { tenure_months: 12, rate: 6.85, senior_rate: 7.35 },
      { tenure_months: 24, rate: 7.15, senior_rate: 7.65 },
      { tenure_months: 36, rate: 7.15, senior_rate: 7.65 },
      { tenure_months: 60, rate: 6.5, senior_rate: 7.5 },
    ],
  },
  {
    id: "canara",
    name: "Canara Bank",
    type: "psu",
    min_amount: 1000,
    rates: [
      { tenure_months: 6, rate: 6.15, senior_rate: 6.65 },
      { tenure_months: 12, rate: 6.85, senior_rate: 7.35 },
      { tenure_months: 24, rate: 6.85, senior_rate: 7.35 },
      { tenure_months: 36, rate: 6.8, senior_rate: 7.3 },
      { tenure_months: 60, rate: 6.7, senior_rate: 7.2 },
    ],
  },
  {
    id: "idfc",
    name: "IDFC First Bank",
    type: "private",
    min_amount: 10000,
    rates: [
      { tenure_months: 6, rate: 5.75, senior_rate: 6.25 },
      { tenure_months: 12, rate: 6.5, senior_rate: 7.0 },
      { tenure_months: 24, rate: 7.25, senior_rate: 7.75 },
      { tenure_months: 36, rate: 7.25, senior_rate: 7.75 },
      { tenure_months: 60, rate: 7.0, senior_rate: 7.5 },
    ],
  },
  {
    id: "suryoday",
    name: "Suryoday Small Finance Bank",
    type: "sfb",
    min_amount: 1000,
    featured: true,
    rates: [
      { tenure_months: 6, rate: 6.85, senior_rate: 7.35 },
      { tenure_months: 12, rate: 8.25, senior_rate: 8.75 },
      { tenure_months: 24, rate: 8.6, senior_rate: 9.1 },
      { tenure_months: 36, rate: 8.5, senior_rate: 9.0 },
      { tenure_months: 60, rate: 8.25, senior_rate: 8.75 },
    ],
  },
  {
    id: "unity",
    name: "Unity Small Finance Bank",
    type: "sfb",
    min_amount: 5000,
    featured: true,
    rates: [
      { tenure_months: 6, rate: 7.15, senior_rate: 7.65 },
      { tenure_months: 12, rate: 8.45, senior_rate: 8.95 },
      { tenure_months: 24, rate: 8.75, senior_rate: 9.25 },
      { tenure_months: 36, rate: 8.5, senior_rate: 9.0 },
      { tenure_months: 60, rate: 8.15, senior_rate: 8.65 },
    ],
  },
  {
    id: "ujjivan",
    name: "Ujjivan Small Finance Bank",
    type: "sfb",
    min_amount: 1000,
    rates: [
      { tenure_months: 6, rate: 6.5, senior_rate: 7.0 },
      { tenure_months: 12, rate: 8.0, senior_rate: 8.5 },
      { tenure_months: 24, rate: 8.25, senior_rate: 8.75 },
      { tenure_months: 36, rate: 7.2, senior_rate: 7.7 },
      { tenure_months: 60, rate: 7.2, senior_rate: 7.7 },
    ],
  },
  {
    id: "au",
    name: "AU Small Finance Bank",
    type: "sfb",
    min_amount: 1000,
    rates: [
      { tenure_months: 6, rate: 6.75, senior_rate: 7.25 },
      { tenure_months: 12, rate: 7.25, senior_rate: 7.75 },
      { tenure_months: 24, rate: 8.0, senior_rate: 8.5 },
      { tenure_months: 36, rate: 7.75, senior_rate: 8.25 },
      { tenure_months: 60, rate: 7.25, senior_rate: 7.75 },
    ],
  },
  {
    id: "equitas",
    name: "Equitas Small Finance Bank",
    type: "sfb",
    min_amount: 1000,
    rates: [
      { tenure_months: 6, rate: 6.5, senior_rate: 7.0 },
      { tenure_months: 12, rate: 8.0, senior_rate: 8.5 },
      { tenure_months: 24, rate: 8.0, senior_rate: 8.5 },
      { tenure_months: 36, rate: 7.25, senior_rate: 7.75 },
      { tenure_months: 60, rate: 7.25, senior_rate: 7.75 },
    ],
  },
];

export function getBankRate(bankId: string, tenureMonths: number, senior = false): number {
  const bank = BANKS.find((b) => b.id === bankId);
  if (!bank) return 0;
  const rate = bank.rates.find((r) => r.tenure_months === tenureMonths);
  if (!rate) {
    // pick closest tenure
    const closest = [...bank.rates].sort(
      (a, b) => Math.abs(a.tenure_months - tenureMonths) - Math.abs(b.tenure_months - tenureMonths)
    )[0];
    return senior ? closest.senior_rate : closest.rate;
  }
  return senior ? rate.senior_rate : rate.rate;
}

export function bestRate(tenureMonths: number, senior = false, filterType?: "psu" | "private" | "sfb") {
  const filtered = filterType ? BANKS.filter((b) => b.type === filterType) : BANKS;
  return filtered
    .map((b) => ({ bank: b, rate: getBankRate(b.id, tenureMonths, senior) }))
    .sort((a, b) => b.rate - a.rate);
}

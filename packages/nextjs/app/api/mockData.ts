import { Split } from "./types";

export const data: Split[] = [
  {
    id: "split_001",
    name: "Dinner in Prague",
    tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
    fiatAmount: 120,
    fiatCurrency: "EUR",
    verified: true,
    requestorAddress: "0x9bE875105C5c2663dbdA4f32EDfcEe154CAEF6E4",
    contributors: [
      { username: "alice", contributed: 40, toContribute: 40 },
      { username: "bob", contributed: 30, toContribute: 40 },
      { username: "carol", contributed: 50, toContribute: 40 },
    ],
  },
  {
    id: "split_002",
    name: "Concert Tickets",
    tokenAddress: "0x9876543210abcdef9876543210abcdef98765432",
    fiatAmount: 300,
    fiatCurrency: "USD",
    verified: false,
    requestorAddress: "0x9bE875105C5c2663dbdA4f32EDfcEe154CAEF6E4",
    contributors: [
      { username: "dan", contributed: 100, toContribute: 100 },
      { username: "erin", contributed: 50, toContribute: 100 },
      { username: "frank", contributed: 150, toContribute: 100 },
    ],
  },
  {
    id: "split_003",
    name: "Grocery Run",
    tokenAddress: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    fiatAmount: 75,
    fiatCurrency: "GBP",
    verified: true,
    requestorAddress: "0x9bE875105C5c2663dbdA4f32EDfcEe154CAEF6E4",
    contributors: [
      { username: "gina", contributed: 25, toContribute: 25 },
      { username: "hank", contributed: 25, toContribute: 25 },
      { username: "ian", contributed: 25, toContribute: 25 },
    ],
  },
  {
    id: "split_004",
    name: "Weekend Getaway",
    tokenAddress: "0xbeefbeefbeefbeefbeefbeefbeefbeefbeefbeef",
    fiatAmount: 500,
    fiatCurrency: "CHF",
    verified: false,
    requestorAddress: "0x9bE875105C5c2663dbdA4f32EDfcEe154CAEF6E4",
    contributors: [
      { username: "julia", contributed: 200, toContribute: 250 },
      { username: "kevin", contributed: 150, toContribute: 250 },
    ],
  },
  {
    id: "split_005",
    name: "Birthday Surprise",
    tokenAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    fiatAmount: 220,
    fiatCurrency: "CZK",
    verified: true,
    requestorAddress: "0x9bE875105C5c2663dbdA4f32EDfcEe154CAEF6E4",
    contributors: [
      { username: "leo", contributed: 70, toContribute: 70 },
      { username: "maya", contributed: 100, toContribute: 70 },
      { username: "nina", contributed: 50, toContribute: 80 },
    ],
  },
];

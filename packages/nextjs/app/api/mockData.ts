import { Split } from "./types";

export const data: Split[] = [
  {
    id: "a3d7xq9",
    name: "Dinner in Prague",
    tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
    fiatAmount: 120,
    fiatCurrency: "EUR",
    verified: true,
    requestorAddress: "0x59a1d62B7c958eC5f0e3334aadb9304F3a5C8CFc",
    contributors: [
      { username: "alice", contributed: 40n, toContribute: 40n, withdrawn: 0n },
      { username: "bob", contributed: 30n, toContribute: 40n, withdrawn: 0n },
      { username: "carol", contributed: 50n, toContribute: 40n, withdrawn: 0n },
    ],
  },
  {
    id: "r9k2bvm",
    name: "Concert Tickets",
    tokenAddress: "0x9876543210abcdef9876543210abcdef98765432",
    fiatAmount: 300,
    fiatCurrency: "USD",
    verified: false,
    requestorAddress: "0x59a1d62B7c958eC5f0e3334aadb9304F3a5C8CFc",
    contributors: [
      { username: "dan", contributed: 100n, toContribute: 100n, withdrawn: 0n },
      { username: "erin", contributed: 50n, toContribute: 100n, withdrawn: 0n },
      { username: "frank", contributed: 150n, toContribute: 100n, withdrawn: 0n },
    ],
  },
  {
    id: "a8m4wzc",
    name: "Grocery Run",
    tokenAddress: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    fiatAmount: 75,
    fiatCurrency: "GBP",
    verified: true,
    requestorAddress: "0x59a1d62B7c958eC5f0e3334aadb9304F3a5C8CFc",
    contributors: [
      { username: "gina", contributed: 25n, toContribute: 25n, withdrawn: 0n },
      { username: "hank", contributed: 25n, toContribute: 25n, withdrawn: 0n },
      { username: "ian", contributed: 25n, toContribute: 25n, withdrawn: 0n },
    ],
  },
  {
    id: "r7yf8lk",
    name: "Weekend Getaway",
    tokenAddress: "0xbeefbeefbeefbeefbeefbeefbeefbeefbeefbeef",
    fiatAmount: 500,
    fiatCurrency: "CHF",
    verified: false,
    requestorAddress: "0x59a1d62B7c958eC5f0e3334aadb9304F3a5C8CFc",
    contributors: [
      { username: "julia", contributed: 200n, toContribute: 250n, withdrawn: 0n },
      { username: "kevin", contributed: 150n, toContribute: 250n, withdrawn: 0n },
    ],
  },
  {
    id: "a4vzm1q",
    name: "Birthday Surprise",
    tokenAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    fiatAmount: 220,
    fiatCurrency: "CZK",
    verified: true,
    requestorAddress: "0x59a1d62B7c958eC5f0e3334aadb9304F3a5C8CFc",
    contributors: [
      { username: "leo", contributed: 70n, toContribute: 70n, withdrawn: 0n },
      { username: "maya", contributed: 100n, toContribute: 70n, withdrawn: 0n },
      { username: "nina", contributed: 50n, toContribute: 80n, withdrawn: 0n },
    ],
  },
];

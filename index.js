require('dotenv').config()
const request = require('request');

const apiKey = process.env.apiKey;

console.log(apiKey);

const getQuote = (ticker) => {
  const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`;
}
require('dotenv').config()
const axios = require('axios');
const mysql = require('mysql2');
const express = require("express");
const app = express();

app.listen(8080, () => {
  console.log("Server running on port 8080");
});

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'stock'
});
const promisePool = pool.promise();

const apiKey = process.env.apiKey;

const getQuote = async (ticker) => {
  const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`;
  const r = await axios.get(url);
  const response = r.data;
  const todayPercentChange = round(((response.c - response.o) / response.o) * 100);
  const currentPrice = round(response.c);
  return { currentPrice, todayPercentChange };
}

const getOwnedStocks = async () => {
  // const connection = await mysql.createConnection({
  //   host: 'localhost',
  //   user: 'root',
  //   password: 'root',
  //   database: 'stock'
  // });
  query = `SELECT * FROM owned WHERE ticker='AAPL'`
  //const [rows, fields] = await connection.execute(query);
  //connection.end()
  const [rows, fields] = await promisePool.execute(query);
  return rows;
}

const round = (num) => {
  return Math.round(num * 100) / 100;
}

const calculatePortfolio = async (res) => {
  const ownedStocks = await getOwnedStocks();
  let response = { stocks: {} };

  const len = ownedStocks.length;
  let counter = 0;

  let totalInvested = 0;
  let netReturn = 0;
  let portfolioGrowth = null;
  let portfolioValue = 0;

  ownedStocks.forEach(async ownedStock => {
    const quoteData = await getQuote(ownedStock.ticker);
    const currentPrice = quoteData.currentPrice;

    const netStockProfit = round((currentPrice - ownedStock.avgBuyPrice) * ownedStock.ownedShares);
    const netStockReturn = round((currentPrice - ownedStock.avgBuyPrice) / ownedStock.avgBuyPrice);
    response.stocks[ownedStock.ticker] = {
      currentPrice,
      pricePercentChange: quoteData.todayPercentChange,
      netStockProfit,
      netStockReturn
    };
    netReturn = round(netReturn + netStockProfit);
    portfolioValue = round(portfolioValue + currentPrice * ownedStock.ownedShares);
    totalInvested = round(totalInvested + ownedStock.avgBuyPrice * ownedStock.ownedShares);
    portfolioGrowth = round((netReturn - totalInvested) / totalInvested);

    //why do i need to do this why can I not just return after
    if (++counter === len) {
      res.json({ ...response, portfolioGrowth, netReturn, portfolioValue, totalInvested });
    }
  });
}

app.get("/portfolio", (req, res) => {
  calculatePortfolio(res);
})
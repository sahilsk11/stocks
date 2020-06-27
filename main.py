import requests
import passwords
import mysql.connector
from pprint import pprint

api_key = passwords.api_key()


def get_quote(ticker):
    url = f"https://finnhub.io/api/v1/quote?symbol={ticker}&token={api_key}"
    r = requests.get(url)
    if r.status_code == 200:
        response = r.json()
        today_percent_change = round(
            ((response["c"] - response["o"]) / response["o"]) * 100, 2)
        current_price = round(response["c"], 2)
        return {
            "current_price": current_price,
            "today_percent_change": today_percent_change
        }
    else:
        print("Error with connection")
        print(r.text[:100])


def get_owned_stocks():
    mydb = mysql.connector.connect(
        host="localhost",
        user="root",
        passwd="root",
        database="stock"
    )
    query = "SELECT * FROM owned"
    cursor = mydb.cursor(dictionary=True)
    cursor.execute(query)
    output = cursor.fetchall()
    cursor.close()
    return output


def calculate_portfolio():
    owned_stocks = get_owned_stocks()
    stocks = {}

    total_invested = 0.0
    net_gain = 0.0
    portfolio_growth = None
    portfolio_value = 0.0

    for stock in owned_stocks:
        ticker = stock["ticker"]
        quote_data = get_quote(ticker)
        current_price = quote_data["current_price"]
        buy_price = stock["avgBuyPrice"]

        stock_profit = round((current_price - buy_price)
                             * stock["ownedShares"], 2)
        stock_return_percent = round(
            (current_price - stock["avgBuyPrice"]) / stock["avgBuyPrice"], 2)

        stocks[ticker] = {
            "current_price": current_price,
            "price_percent_change": quote_data["today_percent_change"],
            "net_stock_profit": stock_profit,
            "net_stock_return": stock_return_percent
        }

        net_gain = round(net_gain + stock_profit, 2)
        portfolio_value = round(
            portfolio_value + current_price * stock["ownedShares"], 2)
        total_invested = round(
            total_invested + stock["avgBuyPrice"]*stock["ownedShares"], 2)
        portfolio_growth = round(
            (net_gain - total_invested) / total_invested, 2)
    return {
        "stocks": stocks,
        "net_gain": net_gain,
        "total_invested": total_invested,
        "portfolio_growth": portfolio_growth,
        "portfolio_value": portfolio_value
    }


if __name__ == "__main__":
    pprint(calculate_portfolio())
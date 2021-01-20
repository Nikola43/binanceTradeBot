"use strict";
const colors = require('colors');
const Binance = require('node-binance-api');
let a = {
    LTCBTC: 23,
    ADABTC: 23,
};
let b = {
    LTCBTC: 23,
    ADABTC: 23,
    XLMBTC: 23,
};
function sleep(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}
function filterBtcPairSymbols(symbols) {
    const filteredSymbols = [];
    Object.keys(symbols).forEach((element, key, _array) => {
        if (element.includes('BTC')) {
            filteredSymbols.push(element);
        }
    });
    return filteredSymbols;
}
function getNewSymbol(previousSymbols, newSymbols) {
    let difference = Object.keys(newSymbols).filter(x => !Object.keys(previousSymbols).includes(x));
    return difference[0];
}
function getSymbolPrice(arr1, symbol) {
    console.log(arr1[symbol]);
    return arr1[symbol];
}
function calculatePercentPrice(price, percent) {
    return ((price * percent) / 100);
}
async function getBalanceBySymbol(client, symbol) {
    const balances = await client.balance();
    console.log(balances[symbol.replace('BTC', "")].available);
    return balances[symbol.replace('BTC', "")].available;
}
async function createStopLoss(client, symbol, quantity, price, stopPrice) {
    // create stop loss
    return await client.sell(symbol, quantity, price, { stopPrice: stopPrice, type: "STOP_LOSS_LIMIT" });
}
function calculateMaxBuyQuantity(price, balance) {
    return balance / price;
}
(async () => {
    let apikey = 'z8oJ86HRXRKHppUeLZMOY8564f3gnNueSrmOL1455SXtkTmyHwusLc1XCjjGBKZt';
    let secret = 'UZggnxZ7moBpHw74iGK9SkXHlnci6RAsajO7x1wptsGvgr2qs5lRNu6y5WvJZvDJ';
    let previousSymbols = {};
    let counter = 0;
    let newSymbol = 'XLMBTC';
    let newSymbolPrice;
    let buyPrice = 0;
    let buyQuantity = 0;
    let stopLossPrice = 0;
    let stopLossStopPrice = 0;
    let stopLossStopQuantity = 0;
    let lastSymbolPrice = 0;
    let stopLossOrderResult;
    const client = new Binance().options({
        APIKEY: apikey,
        APISECRET: secret,
    });
    const balances = await client.balance();
    const btcBalance = balances['BTC'];
    while (true) {
        const lastPrice = await client.bookTickers(newSymbol);
        newSymbolPrice = lastPrice.askPrice;
        console.log(newSymbol + ": " + newSymbolPrice);
        console.log(colors.green('BUY'));
        buyPrice = newSymbolPrice;
        buyQuantity = calculateMaxBuyQuantity(newSymbolPrice, btcBalance.available);
        console.log("Symbol: " + newSymbol);
        console.log("Buy Price: " + newSymbolPrice);
        console.log("Buy Quantity: " + buyQuantity);
        // buy new symbol
        //const buyOrderResult = await client.buy(newSymbol, buyQuantity, buyQuantity);
        if (newSymbolPrice > lastSymbolPrice) {
            if (stopLossOrderResult
                && stopLossOrderResult.orderId
                && stopLossOrderResult.orderId > 0) {
                const cancelResult = await client.cancel(newSymbol, stopLossOrderResult.orderId);
                console.log(cancelResult);
                if (cancelResult &&
                    cancelResult.orderId
                    && cancelResult.orderId > 0
                    && cancelResult.status === 'CANCELED') {
                    stopLossPrice = Number((newSymbolPrice - calculatePercentPrice(newSymbolPrice, 5)).toFixed(8));
                    stopLossStopPrice = Number((stopLossPrice - calculatePercentPrice(stopLossPrice, 1)).toFixed(8));
                    stopLossStopQuantity = await getBalanceBySymbol(client, newSymbol);
                    stopLossStopQuantity = Number((stopLossStopQuantity - calculatePercentPrice(stopLossStopQuantity, 1)).toFixed(0));
                    console.log(colors.red('STOP LOSS'));
                    console.log("Stop Loss Price: " + stopLossPrice);
                    console.log("Stop Loss Stop Price: " + stopLossStopPrice);
                    console.log("Stop Loss Quantity: " + stopLossStopQuantity);
                    client.sell(newSymbol, stopLossStopQuantity, stopLossPrice, {
                        stopPrice: stopLossStopPrice,
                        type: "STOP_LOSS_LIMIT"
                    }, (error, response) => {
                        console.log(error);
                        console.log(response);
                        if (error) {
                            return error;
                        }
                        else {
                            stopLossOrderResult = response;
                            console.log(stopLossOrderResult);
                            return response;
                        }
                    });
                }
            }
            else {
                stopLossPrice = Number((newSymbolPrice - calculatePercentPrice(newSymbolPrice, 5)).toFixed(8));
                stopLossStopPrice = Number((stopLossPrice - calculatePercentPrice(stopLossPrice, 1)).toFixed(8));
                stopLossStopQuantity = await getBalanceBySymbol(client, newSymbol);
                stopLossStopQuantity = Number((stopLossStopQuantity - calculatePercentPrice(stopLossStopQuantity, 1)).toFixed(0));
                console.log(colors.red('STOP LOSS'));
                console.log("Stop Loss Price: " + stopLossPrice);
                console.log("Stop Loss Stop Price: " + stopLossStopPrice);
                console.log("Stop Loss Quantity: " + stopLossStopQuantity);
                client.sell(newSymbol, stopLossStopQuantity, stopLossPrice, {
                    stopPrice: stopLossStopPrice,
                    type: "STOP_LOSS_LIMIT"
                }, (error, response) => {
                    console.log(error);
                    console.log(response);
                    if (error) {
                        return error;
                    }
                    else {
                        stopLossOrderResult = response;
                        console.log(stopLossOrderResult);
                        return response;
                    }
                });
            }
        }
        lastSymbolPrice = newSymbolPrice;
        await sleep(500);
    }
})();
//# sourceMappingURL=app.js.map
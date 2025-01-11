import React, { useState } from "react";
import * as xrpl from 'xrpl';

import IssuerDropdown from "./IssuerDropdown.js";

const App = () => {
  const [currencyGet, setCurrencyGet] = useState("");
  const [issuerGet, setIssuerGet] = useState("");
  const [valueGet, setValueGet] = useState("");
  const [currencyPay, setCurrencyPay] = useState("");
  const [issuerPay, setIssuerPay] = useState("");
  const [valuePay, setValuePay] = useState("");
  const [orderbookResult, setOrderbookResult] = useState("");


  function checkCurrencyField(value) {
    const supportedCurrencies = ["XRP", "EUR", "USD", "GBP", "BTC"];
    return supportedCurrencies.includes(value) || value === "";
  }

  function decideTakerGetsIssuer(){
    if (currencyGet === "XRP") {
      const takerGets = {
        currency: currencyGet,
        value: valueGet
      }  
      return takerGets;
    }
    else {
      const takerGets = {
        currency: currencyGet,
        issuer: issuerGet,
        value: valueGet
      }
      return takerGets;
    }
  }

  function decideTakerPaysIssuer(){
    if (currencyPay === "XRP") {
      const takerPays = {
        currency: currencyPay,
        value: valuePay
      }
      return takerPays;
    }
    else {
      const takerPays = {
        currency: currencyPay,
        issuer: issuerPay,
        value: valuePay
      }
      return takerPays;
    }
  }



  const handleFetchOffers = async () => {
    const client = new xrpl.Client("wss://s1.ripple.com");
    await client.connect();
    const wallet = xrpl.Wallet.fromSeed("sEdVh3t1NTAsRxvwKtqRde2kSp8p5Fb");

    const takerGets = decideTakerGetsIssuer();
    const takerPays = decideTakerPaysIssuer();

    if (!checkCurrencyField(takerGets.currency)) {
      setOrderbookResult("Invalid currency code for Taker Gets.");
      return;
    }
    if (!checkCurrencyField(takerPays.currency)) {
      setOrderbookResult("Invalid currency code for Taker Pays.");
      return;
    }
    if (isNaN(takerGets.value) || isNaN(takerPays.value) || takerGets.value === "" || takerPays.value === "") {
      setOrderbookResult("Invalid value for Taker Gets or Taker Pays.");
      return;
    }

    try {
      await lookUpOffers(client, wallet, takerGets, takerPays);
    } catch (error) {
      console.error("Error fetching offers:", error);
      setOrderbookResult("Error fetching offers.");
    } finally {
      await client.disconnect();
    }
  };


  const handleFetchAskOffers = async () => {
    const client = new xrpl.Client("wss://s1.ripple.com");
    await client.connect();
    const wallet = xrpl.Wallet.fromSeed("sEdVh3t1NTAsRxvwKtqRde2kSp8p5Fb");

    const takerGets = decideTakerGetsIssuer();
    const takerPays = decideTakerPaysIssuer();

    if (!checkCurrencyField(takerGets.currency)) {
      setOrderbookResult("Invalid currency code for Taker Gets.");
      return;
    }
    if (!checkCurrencyField(takerPays.currency)) {
      setOrderbookResult("Invalid currency code for Taker Pays.");
      return;
    }

    try {
      await lookUpAskOffers(client, wallet, takerGets, takerPays);
    } catch (error) {
      console.error("Error fetching offers:", error);
      setOrderbookResult("Error fetching offers.");
    } finally {
      await client.disconnect();
    }
  };

  const handleFetchBidOffers = async () => {
    const client = new xrpl.Client("wss://s1.ripple.com");
    await client.connect();
    const wallet = xrpl.Wallet.fromSeed("sEdVh3t1NTAsRxvwKtqRde2kSp8p5Fb");

    const takerGets = decideTakerGetsIssuer();
    const takerPays = decideTakerPaysIssuer();

    if (!checkCurrencyField(takerGets.currency)) {
      setOrderbookResult("Invalid currency code for Taker Gets.");
      return;
    }
    if (!checkCurrencyField(takerPays.currency)) {
      setOrderbookResult("Invalid currency code for Taker Pays.");
      return;
    }

    try {
      await lookUpBidOffers(client, wallet, takerGets, takerPays);
    } catch (error) {
      console.error("Error fetching offers:", error);
      setOrderbookResult("Error fetching offers.");
    } finally {
      await client.disconnect();
    }
  }


  const lookUpOffers = async (client, wallet, takerGets, takerPays) => {
    let proposed_quality;
    if (takerGets.currency === "XRP") {
      proposed_quality = takerPays.value / xrpl.xrpToDrops(takerGets.value);
    } else if (takerPays.currency === "XRP") {
      proposed_quality = xrpl.xrpToDrops(takerPays.value) / takerGets.value;
    } else {
      proposed_quality = takerPays.value / takerGets.value;
    }

    const orderbook_resp = await client.request({
      command: "book_offers",
      taker: wallet.address,
      ledger_index: "current",
      taker_gets: takerGets,
      taker_pays: takerPays
    });

    const offers = orderbook_resp.result.offers;
    let running_total = 0;  // checking if our offer will be filled
    let total_price = 0;

    if (!offers || offers.length === 0) {
      setOrderbookResult("No Offers in the matching book.");
    } else {
      let matchedOffers = [];
      for (const o of offers) {
        if (proposed_quality >= o.quality) {
          if (takerGets.currency === "XRP") {
            const quality = parseFloat(o.TakerPays.value) / parseFloat(xrpl.dropsToXrp(o.TakerGets));
            running_total += Math.min(o.owner_funds ?? xrpl.dropsToXrp(o.TakerGets), xrpl.dropsToXrp(o.TakerGets));  // if owner_fund is lower than takerGets, use owner_fund
            total_price += parseFloat(o.TakerPays.value);
            matchedOffers.push(
              `Ask: ${quality} ${o.TakerPays.currency} per ${takerGets.currency} Quantity: ${Math.min(o.owner_funds ?? xrpl.dropsToXrp(o.TakerGets), xrpl.dropsToXrp(o.TakerGets))
              }`
            );
            if (running_total >= takerGets.value) {
              matchedOffers.push(
                `Offer will be filled with Total Funds: ${running_total} ${takerPays.currency} found.`
              );
              matchedOffers.push(
                `Total Price: ${total_price} ${takerPays.currency}`
              );
              break;
            }
          }
          else if (takerPays.currency === "XRP") {
            const quality = parseFloat(xrpl.dropsToXrp(o.TakerPays)) / (o.TakerGets.value);
            running_total += Math.min(o.owner_funds ?? o.TakerGets.value, o.TakerGets.value);  // if owner_fund is lower than takerGets, use owner_fund
            total_price += parseFloat(xrpl.dropsToXrp(o.TakerPays));
            matchedOffers.push(
              `Ask: ${quality} ${takerPays.currency} per ${o.TakerGets.currency} Quantity: ${Math.min(o.owner_funds ?? o.TakerGets.value, o.TakerGets.value)
              }`
            );
            if (running_total >= takerGets.value) {
              matchedOffers.push(
                `Offer will be filled with Total Funds: ${running_total} ${takerPays.currency} found.`
              );
              matchedOffers.push(
                `Total Price: ${total_price} ${takerPays.currency}`
              );
              break;
            }
          }
          else {
            running_total += Math.min(o.owner_funds ?? o.TakerGets.value, o.TakerGets.value);  // if owner_fund is lower than takerGets, use owner_fund
            total_price += parseFloat(o.TakerPays.value);
            matchedOffers.push(
              `Ask: ${o.quality} ${o.TakerPays.currency} per ${o.TakerGets.currency} Quantity: ${Math.min(o.owner_funds ?? o.TakerGets.value, o.TakerGets.value)
              }`
            );
            if (running_total >= takerGets.value) {
              matchedOffers.push(
                `Offer will be filled with Total Funds: ${running_total} ${takerPays.currency} found.`
              );
              matchedOffers.push(
                `Total Price: ${total_price} ${takerPays.currency}`
              );
              break;
            }
          }
        } 
        else {
          matchedOffers.push("Remaining orders too expensive.");
          break;
        }
      }
      setOrderbookResult(matchedOffers.join("\n"));
    }
  };

  // this is looking for potential ask offer we can fill
  const lookUpAskOffers = async (client, wallet, takerGets, takerPays) => {
    const orderbook_resp = await client.request({
      command: "book_offers",
      taker: wallet.address,
      ledger_index: "current",
      taker_gets: takerGets,
      taker_pays: takerPays,
      limit: 20
    });

    const offers = orderbook_resp.result.offers;
    if (!offers || offers.length === 0) {
      setOrderbookResult("No Offers found in the order book.");
      return;
    }

    console.log(offers);
    let lowestQualityOffers = [];
    for (let i = 0; i < Math.min(offers.length, 10); i++) {
      const o = offers[i];
      // Check if required properties exist
      if (o?.quality && o?.TakerPays && o?.TakerGets) {
        if (takerGets.currency === "XRP") { // xrp unit is in drops, need to convert
          const quality = parseFloat(o.TakerPays.value) / parseFloat(xrpl.dropsToXrp(o.TakerGets));
          lowestQualityOffers.push(
            `Ask ${i + 1}: ${quality} ${o.TakerPays.currency} per ${takerGets.currency}, Quantity: ${Math.min(o.owner_funds ?? xrpl.dropsToXrp(o.TakerGets), xrpl.dropsToXrp(o.TakerGets))
            }`
          );
        }
        else if (takerPays.currency === "XRP") {
          const quality = parseFloat(xrpl.dropsToXrp(o.TakerPays)) / (o.TakerGets.value);
          lowestQualityOffers.push(
            `Ask ${i + 1}: ${quality} ${takerPays.currency} per ${o.TakerGets.currency}, Quantity: ${Math.min(o.owner_funds ?? o.TakerGets.value, o.TakerGets.value)
            }`
          );
        }
        else{
          lowestQualityOffers.push(
            `Ask ${i + 1}: ${o.quality} ${o.TakerPays.currency} per ${o.TakerGets.currency}, Quantity: ${Math.min(o.owner_funds ?? o.TakerGets.value, o.TakerGets.value)
            }`
          );
        }
        
      } else {
        lowestQualityOffers.push(`Offer ${i + 1}: Missing required fields.`);
      }
    }
  
    setOrderbookResult(lowestQualityOffers.join("\n"));
  };

  // this is looking for current bid offers we can compete with if we make one
  const lookUpBidOffers = async (client, wallet, weWant, weSpend) => {
    const orderbook_resp = await client.request({
      command: "book_offers",
      taker: wallet.address,
      ledger_index: "current",
      taker_gets: weSpend,
      taker_pays: weWant,
      limit: 20
    })

    const offers = orderbook_resp.result.offers;
    if (!offers || offers.length === 0) {
      setOrderbookResult("No Offers found in the order book.");
      return;
    }

    console.log(offers);
    let lowestQualityOffers = [];
    for (let i = 0; i < Math.min(offers.length, 10); i++) {
      const o = offers[i];
      // Check if required properties exist
      if (o?.quality && o?.TakerPays && o?.TakerGets) {
        if (weSpend.currency === "XRP") {
          const quality = parseFloat(xrpl.dropsToXrp(o.TakerGets)) / parseFloat(o.TakerPays.value);
          lowestQualityOffers.push(
            `Bid ${i + 1}: ${quality} ${weSpend.currency} per ${o.TakerPays.currency}, Quantity: ${Math.min(o.owner_funds ?? o.TakerPays.value, o.TakerPays.value)
            }`
          );
        }
        else if (weWant.currency === "XRP") {
          const quality =  (o.TakerGets.value) / parseFloat(xrpl.dropsToXrp(o.TakerPays));
          lowestQualityOffers.push(
            `Bid ${i + 1}: ${quality} ${o.TakerGets.currency} per ${weWant.currency}, Quantity: ${Math.min(o.owner_funds ?? xrpl.dropsToXrp(o.TakerPays), xrpl.dropsToXrp(o.TakerPays))
            }`
          );
        }
        else{
          const quality = (o.TakerGets.value) / (o.TakerPays.value);
          lowestQualityOffers.push(
            `Bid ${i + 1}: ${quality} ${o.TakerGets.currency} per ${o.TakerPays.currency}, Quantity: ${Math.min(o.owner_funds ?? o.TakerPays.value, o.TakerPays.value)
            }`
          );
        }
        
      } else {
        lowestQualityOffers.push(`Offer ${i + 1}: Missing required fields.`);
      }
    }

    setOrderbookResult(lowestQualityOffers.join("\n"));
  }
  
  return (
    <div>
      <h1>XRPL Offer Book</h1>
      
      <div>
        <label>
          Taker Gets Currency:
          <input
            type="text"
            value={currencyGet}
            onChange={(e) => setCurrencyGet(e.target.value)}
          />
        </label>
        <IssuerDropdown label="Taker Gets Issuer:" currency={currencyGet} selectedIssuerAddress={setIssuerGet}/>
        <label>
          Taker Gets Value:
          <input
            type="text"
            value={valueGet}
            onChange={(e) => setValueGet(e.target.value)}
          />
        </label>
      </div>
      
      <div>
        <label>
          Taker Pays Currency:
          <input
            type="text"
            value={currencyPay}
            onChange={(e) => setCurrencyPay(e.target.value)}
          />
        </label>
        <IssuerDropdown label="Taker Pays Issuer:" currency={currencyPay} selectedIssuerAddress={setIssuerPay}/>
        <label>
          Taker Pays Value:
          <input
            type="text"
            value={valuePay}
            onChange={(e) => setValuePay(e.target.value)}
          />
        </label>
      </div>

      <button onClick={handleFetchOffers}>Fetch Offers</button>
      <button onClick={handleFetchAskOffers}>Fetch Ask Offers</button>
      <button onClick={handleFetchBidOffers}>Fetch Bid Offers</button>
      
      <pre>{orderbookResult}</pre>
    </div>
  );
};

export default App;

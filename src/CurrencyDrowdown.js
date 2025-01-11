import React from "react";

const CurrencyDropdown = ({ label, selectedCurrency, onCurrencyChange }) => {
  const currencies = ["XRP", "USD", "EUR", "GBP", "BTC", "ETH", "LTC", "USDC", "XAH"];

  return (
    <div>
      <label>
        {label}:
        <select value={selectedCurrency} onChange={(e) => onCurrencyChange(e.target.value)}>
          <option value="">Select Currency</option>
          {currencies.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default CurrencyDropdown;

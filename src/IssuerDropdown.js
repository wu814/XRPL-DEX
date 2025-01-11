import React, { useState } from "react";

function IssuerDropdown({ label, currency, selectedIssuerAddress}) {
  const gatehubAddress = {
    "EUR": "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq",
    "USD": "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq",
    "BTC": "rchGBxcD1A1C2tdxF6papQYZ8kjRKMYcL",
    "ETH": "rcA8X3TVMST1n3CJeAdGk1RdRCHii7N2h",
    "GBP": "r4GN9eEoz9K4BhMQXe4H1eYNtvtkwGdt8g",
    "XAH": "rswh1fvyLqHizBS2awu1vs6QcmwTBd9qiv",
    "USDC": "rcEGREd8NmkKRE8GE424sksyt1tJVFZwu",
    "LTC": "rcRzGWq6Ng3jeYhqnmM4zcWcUh69hrQ8V"
  }

  const bitstampAddress = {
    "EUR": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
    "USD": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
    "BTC": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
    "GBP": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B"
  }

  const issuers = [
    { name: "GateHub", value: gatehubAddress[currency] },
    { name: "Bitstamp", value: bitstampAddress[currency] },
  ];

  const [selectedIssuer, setSelectedIssuer] = useState("");
  const [issuerAddress, setIssuerAddress] = useState("");

  const handleChange = (event) => {
    const selectedIssuerName = event.target.value;
    setSelectedIssuer(selectedIssuerName);
    
    // Find the selected issuer and update the address
    const selected = issuers.find(issuer => issuer.name === selectedIssuerName);
    setIssuerAddress(selected ? selected.value : "");
    if (selected) {
      selectedIssuerAddress(selected.value); // Send the selected issuer's address to the parent
    } else {
      selectedIssuerAddress(""); // Clear the issuer address if none is selected
    }  
  };

  return (
    <div>
      <label htmlFor="issuer-dropdown">{label}</label>
      <select
        id="issuer-dropdown"
        value={selectedIssuer}
        onChange={handleChange}
      >
        <option value="">Select Issuer</option>
        {issuers.map((issuer, index) => (
          <option key={index} value={issuer.name}>
            {issuer.name}
          </option>
        ))}
      </select>
      {issuerAddress && <p>Selected Issuer Address: {issuerAddress}</p>}
    </div>
  );
}

export default IssuerDropdown;
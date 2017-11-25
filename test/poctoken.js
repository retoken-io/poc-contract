var PoCToken = artifacts.require("./PoCToken.sol");

var token; 

// token initial values
var TOTAL_PRICE_WEI = 15200000000000000000;
var TOKEN_RATE = 1000000000000000;
var BROKER_ACCOUNT =  0x588331DFAAF70FC5dc035568838dF7990dC42C25;
;

var LEGAL_RECORD1 = "Property located at NY";
var LEGAL_RECORD2 = "Property purchased for 1000";

contract('PoCToken', accounts => {
  before(async() => {
    token = await PoCToken.new();
  });

  it("Constructor logic check", async() => {
    let tokenRate = await token.tokenRate();
    assert.equal(tokenRate, TOKEN_RATE, "Token rate is not assigned");

    let totalValueWei = await token.totalValueWei();
    assert.equal(totalValueWei, TOTAL_PRICE_WEI, "Token value in Wei is not assigned");

    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply, TOTAL_PRICE_WEI/TOKEN_RATE, "Token supply is not calculated");

    let remainingTokens = await token.remainingTokens();
    assert.equal(remainingTokens, TOTAL_PRICE_WEI/TOKEN_RATE, "Token reminder is not assigned");
    
    let brokerAddress = await token.brokerAddress();
    assert.equal(brokerAddress, BROKER_ACCOUNT, "Broker address is not assigned");

    assert.equal(token.balanceOwners.length, 0, "Balance owners are not empty");

    assert.equal(token.legalRecords.length, 0, "Legal records are not empty");

  });
  
});
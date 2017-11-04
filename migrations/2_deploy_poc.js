var PoCToken = artifacts.require("./PoCToken.sol");
var PoCIncomeManager = artifacts.require("./PoCIncomeManager.sol");

module.exports = function(deployer) {
  deployer.deploy(PoCToken).then(() => {
    return deployer.deploy(PoCIncomeManager);
    // return deployer.deploy(PoCIncomeManager, PoCToken.address);
  });
};

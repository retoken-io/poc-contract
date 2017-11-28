var BasicACL = artifacts.require("./BasicACL.sol");

module.exports = function(deployer) {
  deployer.deploy(BasicACL);
};

'use strict';
var PoCIncomeManager = artifacts.require('./PoCIncomeManager.sol');
var PoCToken = artifacts.require('./PoCToken.sol');
const assertJump = require('./helpers/assertJump');

const BigNumber = web3.BigNumber;

var totalValueWei = 15200000000000000000;
                     
var tokenRate = 1000000000000000;
var investorCount = 4; 

contract('PoCIncomeManager', function(accounts) {
    let manager;
    let pocToken;
    let contractOwnerAddress = accounts[8];
    let incomeProviderAddress = accounts[9];

    before(async function() {
        pocToken = await PoCToken.new({from: contractOwnerAddress});
        let purchasedTokens = totalValueWei/tokenRate/investorCount;
        
        //distributing tokens evenly between investors
        let purchaseValue = totalValueWei/investorCount;        
        for(var i = 0; i < investorCount; i++) {
            await pocToken.purchaseTokens({from: accounts[i], value: purchaseValue});
        }
        //send tokens back and forth as this introduces duplicates in PoCToken.balanceOwners
        await pocToken.transfer(accounts[0], purchasedTokens, {from: accounts[1]});

        await pocToken.transfer(accounts[1], purchasedTokens, {from: accounts[0]});
                
        //send half of tokens to another investor
        await pocToken.transfer(accounts[4], purchasedTokens/2, {from: accounts[0]});
        
    });

    beforeEach(async function() {        
        manager = await PoCIncomeManager.new({from: contractOwnerAddress});
        await manager.setPoCToken(pocToken.address, {from: contractOwnerAddress});
        await manager.setIncomeProvider(incomeProviderAddress, {from: contractOwnerAddress});
        // await web3.eth.sendTransaction({from: incomeProviderAddress, to: manager.address, value: totalValueWei/1000 });
    });
    

    it('should have PoCToken assigned', async() => {
        var incomeProvider = await manager.incomeProvider();
        assert.equal(incomeProvider, incomeProviderAddress);
    });

    it('should have income manager assigned', async() => {
        let _pocToken = await manager.pocToken({from: accounts[1]});
        assert.equal(_pocToken, pocToken.address);
    });

    it('should have no balances initially', async() => {
        let ownerCount = await manager.getOwnersLength();
        assert.equal(ownerCount, 0);
    });

    it("should return false when address is non in balances list", async() => {
        let hasBalance = await manager.hasBalance(accounts[1]);
        assert.isFalse(hasBalance);
    });

    it("should create balance if requested by contract owner", async()=>{
        let balanceAddress = accounts[1];
        let balanceAmount = 1000;
        await manager.createBalancePub(balanceAddress, balanceAmount, {from: contractOwnerAddress});
        let balance = await manager.balanceOf(balanceAddress);
        assert.equal(balance, balanceAmount);         
    });

    it("should throw error when balance is created not by contract owner", async()=>{
        let balanceAddress = accounts[1];
        let balanceAmount = 1000;
        try{
            await manager.createBalancePub(balanceAddress, balanceAmount, {from: balanceAddress});
            assert.fail("should not create a balance");
        }catch(error) {
            assertJump(error);
        }    
    });

    it("should increase balance if requested by contract owner", async()=>{
        let balanceAddress = accounts[1];
        let balanceAmount = 1000;
        await manager.createBalancePub(balanceAddress, balanceAmount, {from: contractOwnerAddress});
        await manager.increaseBalancePub(balanceAddress, balanceAmount, {from: contractOwnerAddress});
        let balance = await manager.balanceOf(balanceAddress);
        assert.equal(balance, 2 * balanceAmount);         
    });

    it("should decrease balance if requested by contract owner", async()=>{
        let balanceAddress = accounts[1];
        let balanceAmount = 1000;
        await manager.createBalancePub(balanceAddress, balanceAmount, {from: contractOwnerAddress});
        await manager.decreaseBalancePub(balanceAddress, balanceAmount, {from: contractOwnerAddress});
        let balance = await manager.balanceOf(balanceAddress);
        assert.equal(balance, 0);         
    });

    it('should distribute income according to balances', async() => {
        var watcher = manager.BalanceChanged();
        var incomeProvider = await manager.incomeProvider();
        assert.equal(incomeProvider, incomeProviderAddress);
        // distribute income equal to the property value
        await manager.distributeIncome({from: incomeProvider, value: totalValueWei});
    
        let ownerCount = await manager.getOwnersLength();
        assert.equal(ownerCount, investorCount+1);
        
        assert.equal(
            web3.eth.getBalance(manager.address), 
            totalValueWei, 
            'contract balance should be equal to the distributed income'
        );

        // address[0] should have income equal 1/8 of total value
        let balanceToCheck = await manager.balanceOf(accounts[0]);
        assert.equal(balanceToCheck, totalValueWei/investorCount/2);

        //add one more owner by transferring half of tokens a new address
        await pocToken.transfer(accounts[5], totalValueWei/tokenRate/investorCount/2, {from: accounts[1]});
        
        // using default method for income distribution
        await web3.eth.sendTransaction({from: incomeProviderAddress, to: manager.address, value: totalValueWei/1000, gas: 600000 });
        
        ownerCount = await manager.getOwnersLength();
        assert.equal(ownerCount, investorCount+2);
        assert.equal(web3.eth.getBalance(manager.address), totalValueWei+totalValueWei/1000);
        // address[5] should have income equal 1/8 of total value
        balanceToCheck = await manager.balanceOf(accounts[5]);
        assert.equal(balanceToCheck, totalValueWei/investorCount/2/1000);

    });

    it('should throw error when distributing income not by manager', async() => {
       try{
            await manager.distributeIncome({from: contractOwnerAddress, value: totalValueWei});
            assert.fail("should not distribute income");
        }catch(error) {
            assertJump(error);
        }            
    });

    it('should withdraw any balance when requested by owner', async()=>{
        await manager.distributeIncome({from: incomeProviderAddress, value: totalValueWei});
        var incomeProviderBalance = web3.eth.getBalance(incomeProviderAddress);
        await manager.transfer(incomeProviderAddress, totalValueWei, {from: contractOwnerAddress});
        var contractBalance = web3.eth.getBalance(manager.address);
        assert.equal(contractBalance, 0);
        var newIncomeProviderBalance = web3.eth.getBalance(incomeProviderAddress);
        assert.equal(newIncomeProviderBalance.toString(), incomeProviderBalance.plus(totalValueWei).toString());
    });

    it('should reject balance withdrawal when requested not by owner', async()=>{
        try{
            await manager.distributeIncome({from: incomeProviderAddress, value: totalValueWei});
            await manager.transfer(incomeProviderAddress, 1, {from: incomeProviderAddress});
            assert.fail("should not distribute income");
        }catch(error) {
            assertJump(error);
        } 
    });
    
    it('should withdraw partial balance when requested by balance owner', async()=>{
        let incomeValue = totalValueWei/1000;
        let targetAccount = accounts[0];
        await manager.distributeIncome({from: incomeProviderAddress, value: incomeValue});
        let accountIncome = await manager.balanceOf(targetAccount);
        let accountBalance = web3.eth.getBalance(targetAccount);
        await manager.withdraw(accountIncome/2, {from: targetAccount});
        let newBalance = web3.eth.getBalance(targetAccount);
        
        // should be checked considering consumed gas
        // assert.equal(newBalance.toString(), accountBalance.plus(accountIncome/2).toString());
        let newAccountIncome = await manager.balanceOf(targetAccount);
        assert.equal(newAccountIncome, accountIncome/2);

        //remove remaining half of income
        await manager.withdrawAll({from: targetAccount});
        newAccountIncome = await manager.balanceOf(targetAccount);
        assert.equal(newAccountIncome, 0);                
    });
    
    it('should reject to withdraw too much balance when requested by balance owner', async()=>{
        try{
            let incomeValue = totalValueWei/1000;
            let targetAccount = accounts[0];
            await manager.distributeIncome({from: incomeProviderAddress, value: incomeValue});
            let accountIncome = await manager.balanceOf(targetAccount);
            await manager.withdraw(accountIncome.plus(1), {from: targetAccount});
            assert.fail("should not distribute income");
        }catch(error) {
            assertJump(error);
        } 
    });

    it('should reject to withdraw any balance when requested by non-balance owner', async()=>{
        try{
            let incomeValue = totalValueWei/1000;
            let targetAccount = accounts[6];
            await manager.distributeIncome({from: incomeProviderAddress, value: incomeValue});
            let hasBalance = await manager.hasBalance(targetAccount);
            assert.isFalse(hasBalance);
            await manager.withdraw(1, {from: targetAccount});
            assert.fail("should not distribute income");
        }catch(error) {
            assertJump(error);
        }
    });


    it("should have an owner", async() => {
      let owner = await manager.owner();
      assert.equal(owner, contractOwnerAddress);
    });

    it("should set description", async() => {
        let newDescription = "test description";
        await manager.setDescription(newDescription, {from: contractOwnerAddress});
        let description = await manager.description({from: incomeProviderAddress});
        assert.equal(description, newDescription);
          
    });

    it('should reject description change when requested not by owner', async()=>{
        try{
            await manager.setDescription("test", {from: incomeProviderAddress});            
            assert.fail("should not change description");
        }catch(error) {
            assertJump(error);
        } 
    });

});  
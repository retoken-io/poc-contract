pragma solidity ^0.4.11;

import "./ownership/Ownable.sol";
import "./PoCToken.sol";

/**
* @dev Contract for PoCToken related income distribution  
*/
contract PoCIncomeManager is Ownable {
    address public pocToken = 0xCEC49Cdf893A92b7D2e15DF77fEA44367b06e095;
    address public incomeProvider = 0x970312CE025B8F17EFDdD05fF4A2fA5d1F1c4703;
    string public description = "";
    /**
    * event for logging of balance changes
    * @param sender who sent request for balance change
    * @param owner whos balance changed
    * @param amount changed    
    */
    event BalanceChanged(address indexed sender, address indexed owner, uint amount);
    /**
    * event for logging of whithdrawals
    * @param sender who sent request for withdrawal
    * @param destination of withdrawal
    * @param amount withdrawn    
    */
    event Withdrawal(address indexed sender, address indexed destination, uint amount);

    struct Balance {
        uint amount;
        uint updatedAtBlock;
        uint ownerIndex;
    }
    mapping(address => Balance) public balances;
    address[] public balanceOwners;    

    // function PoCIncomeManager(address _pocToken) public {
    //     pocToken = _pocToken;
    // }

    function PoCIncomeManager() public {
        
    }

    /**
    * Returns length of balance owners
    */
    function getOwnersLength() constant public returns(uint) {
        return balanceOwners.length;
    }
    /**
    * Distributes income based on balances of PoCToken 
    */
    function distributeIncome() payable incomeProviderOnly public {      
        // income should be positive
        require(msg.value > 0);        
        uint remainingIncome = msg.value;
        PoCToken token = PoCToken(pocToken); 
        uint totalSupply = token.totalSupply();
        uint remainingTokens = token.remainingTokens();
        uint incomePerToken = remainingIncome/(totalSupply - remainingTokens);
        
        // by a mistake PoCToken has no getter for owners length, so iteration through owners is needed
        uint i = 0;
        uint ownerTokenBalance = 0;
        uint income = 0;
        address ownerAddress;
        Balance memory currentBalance;
        uint currentBlock = block.number;
        // since size of balance owners is unknown, 
        // balances are added to remaining tokens 
        // until totalSupply is reached
        while (remainingTokens < totalSupply) {
            ownerAddress = token.balanceOwners(i++);
            ownerTokenBalance = token.balanceOf(ownerAddress);            
            income = ownerTokenBalance * incomePerToken;
                    
            if (hasBalance(ownerAddress)) {
                currentBalance = balances[ownerAddress];
                if (currentBalance.updatedAtBlock == currentBlock) 
                    continue;
                increaseBalance(ownerAddress, income);
            }else {
                createBalance(ownerAddress, income);
            }

            // If attempted to distribute less than available, 
            // this should stop;            
            remainingIncome -= income;
            assert(remainingIncome >= 0);            
            remainingTokens += ownerTokenBalance;
        }      
        
    }

    function withdrawAll() public returns (uint remainingBalance) {
        return withdrawPrivate(msg.sender, balances[msg.sender].amount);
    }

    function withdraw(uint withdrawAmount) public returns (uint remainingBalance) {
        return withdrawPrivate(msg.sender, withdrawAmount);
    }

    function withdrawPrivate(address destination, uint withdrawAmount) private returns (uint remainingBalance) {
        require(balances[destination].amount >= withdrawAmount);        
        decreaseBalance(destination, withdrawAmount);
        if (!destination.send(withdrawAmount)) { 
            increaseBalance(destination, withdrawAmount);
            revert();        
        }
        
        Withdrawal(msg.sender, destination, withdrawAmount);        
        return balances[destination].amount;
    }

    function transfer(address destination, uint amount) payable onlyOwner public {
        require(destination != 0);
        destination.transfer(amount);
        Withdrawal(msg.sender, destination, amount);        
    }

    function balanceOf(address owner) constant public returns(uint) {        
        return balances[owner].amount;
    }

    function hasBalance(address owner) constant public returns(bool) {
        if (balanceOwners.length == 0) 
            return false;
        return (balanceOwners[balances[owner].ownerIndex] == owner);  
    }    

    function createBalancePub(address owner, uint amount) onlyOwner public {
        createBalance(owner, amount);
    }

    function createBalance(address owner, uint amount) private {
        balanceOwners.push(owner);
        Balance memory newBalance = Balance(
            {   ownerIndex: balanceOwners.length - 1,
                amount: amount,
                updatedAtBlock: block.number });
        balances[owner] = newBalance;        
        BalanceChanged(msg.sender, owner, amount);
    }

    function increaseBalancePub(address owner, uint amount) onlyOwner public returns (uint) {
        increaseBalance(owner, amount);
    }

    function increaseBalance(address owner, uint amount) private returns (uint) {
        Balance storage currentBalance = balances[owner];
        uint newBalance = currentBalance.amount + amount;
        require(newBalance >= currentBalance.amount);
        currentBalance.amount = newBalance;
        currentBalance.updatedAtBlock = block.number;
        BalanceChanged(msg.sender, owner, newBalance);
        return newBalance;
    }

    function decreaseBalancePub(address owner, uint amount) onlyOwner public returns (uint) {
        decreaseBalance(owner, amount);
    }

    function decreaseBalance(address owner, uint amount) private returns (uint) {
        Balance storage currentBalance = balances[owner];
        uint newBalance = currentBalance.amount - amount;
        require(newBalance < currentBalance.amount);
        currentBalance.amount = newBalance;
        currentBalance.updatedAtBlock = block.number;
        BalanceChanged(msg.sender, owner, newBalance);
        return newBalance;
    }
    /**
     */
    function setPoCToken(address _pocToken) onlyOwner public{
        pocToken = _pocToken;
    }
    /**
    * Sets address of income provider what will send income for distribution  
    */
    function setIncomeProvider(address _incomeProvider) onlyOwner public {
        incomeProvider = _incomeProvider;
    }

    /**
    * Set description of a contract. This will include object type which generates income
    */
    function setDescription(string _description) onlyOwner public {
        description = _description;        
    }
    /**
    * Allows call only by income provider
    */
    modifier incomeProviderOnly() {        
        require(msg.sender == incomeProvider);
        _;
    }

    // fallback function can be used to distribute income
    function () payable {
        // BalanceChanged(msg.sender, msg.sender, msg.value);
        distributeIncome();
    }

}
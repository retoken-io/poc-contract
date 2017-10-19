pragma solidity ^0.4.11;

import "./ownership/Ownable.sol";
import "./erc20/StandardToken.sol";

contract PoCToken is StandardToken, Ownable {
    event SaleEvent(string text, uint256 amount);
    event BrokerAddressChanged(address oldAddress, address newAddress);

    string public constant name = "PoCToken";
    string public constant symbol = "PoC_REM";
    uint8 public constant decimals = 6;

    /**
        Price of property in Wei
     */
    uint256 public totalValueWei;
    /**
        Amount of Wei per token
     */
    uint256 public tokenRate;
    /**
        Amount of tokens left for sale
     */
    uint256 public remainingTokens;

    address[] public balanceOwners;
    /**
        List of legal records, which correspond to formal activities related to the contract
     */
    string[] public legalRecords;

    /**
        Address of a broker who sells the property
     */
    address public brokerAddress;

    function PoCToken(uint256 _totalValueWei, uint256 _tokenRate, address _brokerAddress) {
        require(_totalValueWei > 0);
        require(_tokenRate > 0);
        tokenRate = _tokenRate;
        totalValueWei = _totalValueWei;
        totalSupply = _totalValueWei.div(_tokenRate);

        //initially all supply is available for sale
        remainingTokens = totalSupply;
        brokerAddress = _brokerAddress;
    }

    /**
    Purchase tokens based on transaction amount
     */
    function purchaseTokens() payable public {
        uint256 tokenAmount = msg.value.div(tokenRate);
        require(tokenAmount <= remainingTokens);
        remainingTokens = remainingTokens.sub(tokenAmount);
        addBalanceOwner(msg.sender);
        balances[msg.sender] = balances[msg.sender].add(tokenAmount);
        
    }
    // to be implemented
    // function refundTokens(address _refundAddress) onlyOwner public {

    // }

    /**
    Close sale when no more tokens left
     */
    function closeSale() onlyOwner payable public {
        require(brokerAddress != 0);
        SaleEvent("Sale complete. Total amount raised: ", this.balance);
        brokerAddress.transfer(this.balance);
    }

    function addLegalRecord(string text) onlyOwner public {
        legalRecords.push(text);
        SaleEvent(text, 0);
    }

    /**
        Sets new broker address
     */
    function setBrokerAddress(address _brokerAddress) onlyOwner public {
        address oldAddress = brokerAddress;
        brokerAddress = _brokerAddress;
        BrokerAddressChanged(oldAddress, brokerAddress);
    }

    function addBalanceOwner(address _balanceOwner) internal {
        //adding recipient to the array of owners
        if (balances[_balanceOwner] == 0) {
            balanceOwners.push(_balanceOwner);
        }
    }

    /** 
        ERC20 Override to keep track of balance owners
     */
    function transfer(address _to, uint256 _value) public returns (bool) {
        addBalanceOwner(_to);
        return super.transfer(_to, _value);
    }

    /** 
        ERC20 Override to keep track of balance owners
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        addBalanceOwner(_to);
        return super.transferFrom(_from, _to, _value);
    }


}
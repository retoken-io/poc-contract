pragma solidity ^0.4.11;


/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
  address public owner;
  address public nominee;


  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);


  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  function Ownable() public {
    owner = msg.sender;
  }


  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }


  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) onlyOwner public {
    require(newOwner != address(0));
    OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }

  /**
  * @dev Two step ownership change. Nomination of new owner. Ensures that the new owner has access to his address
  * @param _nominee Address of proposed owner
  */
  function nominateOwner(address _nominee) onlyOwner public {
    require(owner != _nominee);
    nominee = _nominee;
  }

  /**
  * @dev Two step ownership change. Acceptance of ownership be the nominee
  */
  function acceptOwnership() public {
    require(nominee == msg.sender);      
    owner = nominee;
    delete nominee;    
  }

}

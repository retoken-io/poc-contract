pragma solidity ^0.4.11;

import "./ACL.sol";
import "../ownership/Ownable.sol";
import "../core/Versionable.sol";

contract BasicACL is ACL, Ownable, Versionable {

  /**
    @dev a map of approved addresses
  */
  mapping(address => bool) public approvals;

  function BasicACL() public {
    approvals[msg.sender] = true;
  }

  function approve(address _address) onlyOwner public returns(bool added) {
    added = (approvals[_address] != true);
    approvals[_address] = true;
  }

  function revoke(address _address) onlyOwner public returns(bool removed) {
    removed = (approvals[_address] == true);
    delete approvals[_address];   
  }

  function isApproved(address _address) view public returns(bool approved) {
    return approvals[_address];
  }

  function setDescription(string _description) onlyOwner public {
    super.setDescription(_description);
  }
  function setVersion(uint8 _version) onlyOwner public {
    super.setVersion(_version);
  }

}

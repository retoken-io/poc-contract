pragma solidity ^0.4.11;

contract ACL {

  function approve(address _address) public returns(bool);
  function revoke(address _address) public returns(bool);
  function isApproved(address _address) view public returns(bool);
  
}

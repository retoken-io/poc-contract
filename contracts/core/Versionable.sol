pragma solidity ^0.4.11;

contract Versionable {
    string public description;
    uint8 public version;
    
    function setDescription(string _description) public {
        description = _description;
    }
    function setVersion(uint8 _version) public {
        version = _version;
    }


  
}
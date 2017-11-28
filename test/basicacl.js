const BasicACL = artifacts.require("./BasicACL.sol");
const assertJump = require('./helpers/assertJump');

contract('BasicACL', accounts => {

  var acl; 
  var ownerAccount = accounts[1];
  var firstAccount = accounts[2];
  var secondAccount = accounts[3];

  beforeEach(async() => {
    acl = await BasicACL.new({from : ownerAccount});
  });

  it("Owner should be presend in ACL right after deployment", async() => {
    let ownerApproved = await acl.isApproved.call(ownerAccount);
    assert.isTrue(ownerApproved, "Owner is not in approval list");
  });
  
  it("No other addresses should be presend in ACL right after deployment", async() => {
    let isApproved = await acl.isApproved.call(firstAccount);
    assert.isFalse(isApproved, "Unexpected account is in approval list");
  });

  it("After adding account to ACL, it should be approved", async() =>{
    let wasInList = await acl.approve(firstAccount, {from : ownerAccount});
    let isApproved = await acl.isApproved.call(firstAccount);
    assert.isTrue(isApproved, "Added account is not in approval list")
  });

  it("Only owner should be allowed to add to ACL", async() => {
    try{
      await acl.approve(firstAccount, {from : firstAccount});
      assert.fail("should not add by non-owner");
    }catch(error) {
        assertJump(error);
    }
  });

  it("After revoking account from ACL, it should not be approved anymore", async() =>{
    await acl.revoke(ownerAccount, {from : ownerAccount});
    let isApproved = await acl.isApproved.call(firstAccount);
    assert.isFalse(isApproved, "Revoked account is in approval list")
  });

  it("Only owner should be allowed to remove from ACL", async() => {
    try{
      await acl.revoke(firstAccount, {from : firstAccount});
      assert.fail("should not revoke by non-owner");
    }catch(error) {
        assertJump(error);
    }
  });

  it("Should allow setting version by owner", async() => {
    let version = 10;
    await acl.setVersion(version, {from: ownerAccount});
    let newVersion = await acl.version.call();
    assert.equal(version, newVersion);
  });

  it("Should not allow setting version by non-owner", async() => {
    try{
      await acl.setVersion(10, {from : firstAccount});
      assert.fail("should not change version");
    }catch(error) {
        assertJump(error);
    }
  });
  
  it("Should allow setting description by owner", async() => {
    let description = "Test description";
    await acl.setDescription(description, {from: ownerAccount});
    let newDescription = await acl.description.call();
    assert.equal(description, newDescription);
  });

  it("Should not allow setting description by non-owner", async() => {
    try{
      await acl.setDescription("test", {from : firstAccount});
      assert.fail("should not change description");
    }catch(error) {
        assertJump(error);
    }
  });
  
  
});

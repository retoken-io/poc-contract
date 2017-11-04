'use strict';
const assertJump = require('./helpers/assertJump');

var Ownable = artifacts.require('./Ownable.sol');

contract('Ownable', function(accounts) {
  let ownable;

  beforeEach(async function() {
    ownable = await Ownable.new();
  });

  it('should have an owner', async function() {
    let owner = await ownable.owner();
    assert.isTrue(owner !== 0);
  });

  it('changes owner after transfer', async function() {
    let other = accounts[1];
    await ownable.transferOwnership(other);
    let owner = await ownable.owner();

    assert.isTrue(owner === other);
  });

  it('should prevent non-owners from transfering', async function() {
    const other = accounts[2];
    const owner = await ownable.owner.call();
    assert.isTrue(owner !== other);
    try {
      await ownable.transferOwnership(other, {from: other});
      assert.fail('should have thrown before');
    } catch(error) {
      assertJump(error);
    }
  });

  it('should guard ownership against stuck state', async function() {
    let originalOwner = await ownable.owner();
    try {
      await ownable.transferOwnership(null, {from: originalOwner});
      assert.fail();
    } catch(error) {
      assertJump(error);
    }
  });

  it('should not allow use empty nominee ', async () => {
    // const other = accounts[3];
    const nominee = await ownable.nominee.call();
    assert.isTrue(nominee == 0, "Nominee should be empty by default");
    try {
        await ownable.acceptOwnership(); 
        assert.fail();
    } catch(error){
        assertJump(error);
    }
    
  });

  it('should allow setting nominee by owner', async () =>{
    const other = accounts[3];
    const wrongNominee = accounts[4];
    
    //nominating new owner
    await ownable.nominateOwner(other);
    let newNominee = await ownable.nominee();
    assert.isTrue(other == newNominee);
    
    // accepting ownership by a wrong address should fail
    try {
        await ownable.acceptOwnership({from: wrongNominee}); 
        assert.fail();
    } catch(error){
        assertJump(error);
    }

    //accepting ownership
    await ownable.acceptOwnership({from: other});
    let newOwner = await ownable.owner();
    assert.isTrue(newOwner == other);

    // nominee should be empty
    const nominee = await ownable.nominee();
    assert.isTrue(nominee == 0);

  });

  it('should not allow setting nominee by non-owner', async () =>{
    const other = accounts[4];
    try {
        await ownable.nominateOwner(other, {from: other});
        assert.fail();
    } catch(error){
        assertJump(error);
    }
  });

});

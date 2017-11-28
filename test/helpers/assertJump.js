module.exports = function(error) {
    assert.isAbove(error.message.search('revert'), -1, '"VM Exception while processing transaction: revert" error must be returned');
  }
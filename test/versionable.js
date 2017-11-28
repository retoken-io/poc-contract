const Versionable = artifacts.require("./core/Versionable.sol");


contract('Versionable', accounts => {
    var versionContract; 
    beforeEach(async() => {
        versionContract = await Versionable.new();
    });

    it("Should allow setting version", async() => {
        let version = 10;
        await versionContract.setVersion(version);
        let newVersion = await versionContract.version.call();
        assert.equal(version, newVersion);
    });

    it("Should allow setting description", async() => {
        let description = "Test description";
        await versionContract.setDescription(description);
        let newDescription = await versionContract.description.call();
        assert.equal(description, newDescription);
    });
});
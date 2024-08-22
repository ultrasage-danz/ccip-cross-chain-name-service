import { expect } from "chai";
import { ethers } from "hardhat";

describe("CrossChainNameService", function () {
    let Lookup: any, Receiver: any, Register: any, config: any;
    const alice: string = "alice.ccns";
    beforeEach(async () => {

        const localSimulatorFactory = await ethers.getContractFactory("CCIPLocalSimulator");
        const localSimulator = await localSimulatorFactory.deploy();

        config = await localSimulator.configuration();

        const Lookup_Factory = await ethers.getContractFactory("CrossChainNameServiceLookup");
        const Receiver_Factory = await ethers.getContractFactory("CrossChainNameServiceReceiver");
        const crossChainNameServiceRegister_Factory = await ethers.getContractFactory("CrossChainNameServiceRegister");

        Lookup = await Lookup_Factory.deploy();
        Receiver = await Receiver_Factory.deploy(config.sourceRouter_, Lookup.getAddress(), config.chainSelector_);
        Register = await crossChainNameServiceRegister_Factory.deploy(config.sourceRouter_, Lookup.getAddress());
    })

    it("Should set Name for Alice via Cross Chain", async () => {
        const enableChainTx = await Register.enableChain(await config.chainSelector_, Receiver.getAddress(), 500_000);
        await enableChainTx.wait();

        await Lookup.setCrossChainNameServiceAddress(Register.getAddress());
        await Lookup.setCrossChainNameServiceAddress(Receiver.getAddress());

        const aliceAddress = await ethers.getSigners();
        const setAddressTx = await Lookup.setCrossChainNameServiceAddress(aliceAddress[0].address);
        await setAddressTx.wait();

        const registerTx = await Lookup.register(alice, aliceAddress[0].address);
        await registerTx.wait();

        expect(await Lookup.lookup(alice)).to.equal(aliceAddress[0].address);
        console.log(`\nAddress for ${alice} succesfully set to - ${aliceAddress[0].address}`);
    })
})
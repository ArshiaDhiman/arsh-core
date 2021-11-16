const HDWalletProvider = require("@truffle/hdwallet-provider");

require("dotenv").config();

module.exports = {
  /*
   * $ truffle test --network <network-name>
   */

  networks: {
    development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 8545, 
      network_id: "*", // Any network (default: none)
    },
    rinkeby: {
      provider: () =>
        new HDWalletProvider(
          process.env.MNEMONIC,
          `https://rinkeby.infura.io/v3/50e24ade08ae4228ae11260eff99b489`
        ),
      network_id: 4, // Ropsten's id
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    timeout: 100000,
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.9", 
    },
  },

  // After you backed up your artifacts you can utilize db by running migrate as follows:
  // $ truffle migrate --reset --compile-all
  //
  // db: {
  // enabled: false,
  // host: "127.0.0.1",
  // adapter: {
  //   name: "sqlite",
  //   settings: {
  //     directory: ".db"
  //   }
  // }
  // }
};

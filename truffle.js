module.exports = {
  networks: {
    production: {
      network_id: 1,
      host: "",
      port: "",
      from: "",
      
    },
    development: {
      host: "localhost",
      port: 8545,
      network_id: "rpc", // Match any network id
      gas: 3500000
    }
  },
  licence: "Private, not for copy or re-distribution",
  authors: [
    "Retoken team <greg@retoken.eu>"
  ]

};

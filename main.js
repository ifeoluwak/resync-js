import { BananaConfig } from "./index.js";

// make function available globally
// window.BananaConfig = BananaConfig;



function fireAway() {
  BananaConfig.init({
  key: "your-api-key-here",
  appId: 7,
  ttl: 60 * 60 * 1000,
  callback: async (data) => {
    // console.log("BananaConfig now ready", JSON.stringify(data, null, 2));
    // console.log("BananaConfig exec", BananaConfig.exec);
    // console.log("BananaConfig instance", BananaConfig.instance);
    const res = await BananaConfig.exec.functionMapper('stripNonAsciiAndGetLength', 'stripNonAsciiAndGetLength.     ');
    console.log("BananaConfig exec result", res, BananaConfig.exec.executionLogs);
  },
  storage: null
})
}

// setTimeout(() => {

// BananaConfig.instance.subscribe = (callback) => {
//     console.log("Subscribed to BananaConfig updates");
// }
// }
// , 500);

fireAway();
// console.log("BananaConfig instance", BananaConfig.instance);
// setTimeout(() => {
// BananaConfig.instance.subscribe((callback) => {
//     console.log("Outside subcription to BananaConfig updates", BananaConfig.instance);
// })
// }
// , 500);
// console.log("BananaConfig instance", BananaConfig.instance);

import { ResyncBase } from "./index.js";

if (typeof window !== "undefined") {
  // make function available globally
  window.ResyncBase = ResyncBase;
}



function fireAway() {
  ResyncBase.init({
  key: "your-api-key-here",
  appId: 7,
  ttl: 60 * 60 * 1000,
  callback: async (data) => {
    // console.log("ResyncBase now ready", JSON.stringify(data, null, 2));
    // console.log("ResyncBase exec", ResyncBase.exec);
    // console.log("ResyncBase instance", ResyncBase.instance);
    // const res = await ResyncBase.exec.functionMapper('stripNonAsciiAndGetLength', 'stripNonAsciiAndGetLength.     ');
    // const res = await ResyncBase.exec.functionMapper('loadJsonResource', 'todos', 3);
    // console.log("ResyncBase exec result", res, ResyncBase.exec.executionLogs);
    // console.log("ResyncBase abtest", ResyncBase.abTest);
    // const variant = await ResyncBase.abTest.getVariant("Test 1", 7);
    // console.log("ResyncBase abTest variant", variant);
    await ResyncBase.getVariant("Test 1", 44);
    // await ResyncBase.recordConversion("Test 1", {name: 'yellow'});
    // console.log("ResyncBase abTest variant", variant);
    // if (await ResyncBase.abTest.getVariant("Test 1", 500) === "world") {
    //   console.log("Test 1 variant is world");
    // }
    // console.log("ResyncBase", ResyncBase);
  },
  storage: null, // or Window.localStorage
})
}
ResyncBase.setUserId("user123");
ResyncBase.setClient("test-client");
ResyncBase.setAttributes({ user: {
  id: "user123",
  name: "John Doe",
} });

// setTimeout(() => {

// ResyncBase.instance.subscribe = (callback) => {
//     console.log("Subscribed to ResyncBase updates");
// }
// }
// , 500);

fireAway();
// console.log("ResyncBase instance", ResyncBase.instance);
// setTimeout(() => {
// ResyncBase.instance.subscribe((callback) => {
//     console.log("Outside subcription to ResyncBase updates", ResyncBase.instance);
// })
// }
// , 500);
// console.log("ResyncBase instance", ResyncBase.instance);

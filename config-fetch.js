export class ConfigFetch {
  constructor() {}
  async fetchAppConfig(key, appId, url) {
    const numOfRetries = 5;
    const retryDelay = 2000; // 2 seconds
    let path = `${appId}/app-datas`;
    const ID_ERROR = "App ID mismatch.";

    const fetchData = async () => {
      try {
        const response = await fetch(`${url}${path}`, {
          method: "GET",
          headers: {
            "x-api-key": key,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch app config: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        // console.error("Error fetching app config:", error);
        throw error; // Re-throw the error to handle it in the retry logic
      }
    };

    // we want to try as much as possible to get the data
    for (let i = 0; i < numOfRetries; i++) {
      try {
        const data = await fetchData();
        if (data) {
        //   // make sure the appId is the same as data.appConfig.appId
        //   if (data.appConfig?.appId !== appId) {
        //     throw new Error(ID_ERROR);
        //   }
          return data;
        }
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        if (error.message.includes(ID_ERROR)) {
          throw error;
        } else {
          if (i < numOfRetries - 1) {
            if (i === 2) {
              path = `${appId}/app-data`;
              console.log("Switching to correct API URL", path);
            }
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          } else {
            throw new Error(
              "Failed to fetch app config after multiple attempts."
            );
          }
        }
      }
    }
  }
}

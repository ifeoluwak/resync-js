import { ResyncBase } from "./index.js";
import ResyncCache from "./cache.js";

export class ConfigFetch {
  constructor() {}

  validateEnv() {
    console.log("Validating environment variables...", 
      ResyncBase.getApiKey(),
      ResyncBase.getAppId(),
      ResyncBase.getApiUrl()
    );
    if (!ResyncBase.getApiKey()) {
      throw new Error("API key is not set. Please initialize ResyncBase with a valid API key.");
    }
    if (!ResyncBase.getAppId()) {
      throw new Error("App ID is not set. Please initialize ResyncBase with a valid App ID.");
    }
    if (!ResyncBase.getApiUrl()) {
      throw new Error("API URL is not set. Please initialize ResyncBase with a valid API URL.");
    }
  }

  async fetchAppConfig() {
    console.log("xxxxxx", ResyncBase.getApiKey(), ResyncBase.getAppId(), ResyncBase.getApiUrl());
    const numOfRetries = 5;
    const retryDelay = 2000; // 2 seconds
    const appId = ResyncBase.getAppId();
    let path = `${appId}/app-datas`;

    this.validateEnv();

    const fetchData = async () => {
      try {
        const response = await fetch(`${ResyncBase.getApiUrl()}${path}`, {
          method: "GET",
          headers: {
            "x-api-key": ResyncBase.getApiKey(),
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch app config: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching app config:", error);
        throw error; // Re-throw the error to handle it in the retry logic
      }
    };

    // we want to try as much as possible to get the data
    for (let i = 0; i < numOfRetries; i++) {
      try {
        const data = await fetchData();
        if (data) {
          return data;
        }
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
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

  async fetchUserVariants() {
    const experiments = ResyncCache.getKeyValue("experiments") || [];
    const experimentIds = experiments.map((experiment) => experiment.id);
    if (!experimentIds || !Array.isArray(experimentIds) || experimentIds.length === 0) {
      console.warn("No experiments found or experiment IDs are invalid.");
      // throw new Error("Experiment IDs must be a non-empty array.");
      return
    }
    this.validateEnv();
    // if userId is not set, use sessionId
    const userId = ResyncCache.getKeyValue("userId")
    const sessionId = ResyncCache.getKeyValue("sessionId");
    let path = `${ResyncBase.getAppId()}/user-variants`;

    const fetchData = async () => {
      try {
        const response = await fetch(`${ResyncBase.getApiUrl()}${path}`, {
          method: "POST",
          headers: {
            "x-api-key": ResyncBase.getApiKey(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            sessionId,
            experimentIds,
            appId: ResyncBase.getAppId(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user variants: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error ------:", error?.message);
        throw error; // Re-throw the error to handle it in the retry logic
      }
    }
    try {
        const data = await fetchData();
        if (data) {
          return data;
        }
      } catch (error) {
        console.error("Error fetching user variants:", JSON.stringify(error));
        throw error; // Re-throw the error to handle it in the retry logic
      }
  }
}

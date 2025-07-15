import { BananaConfig } from "./index.js";
import BananaCache from "./cache.js";

export class ConfigFetch {
  constructor() {}

  validateEnv() {
    console.log("Validating environment variables...", 
      BananaConfig.getApiKey(),
      BananaConfig.getAppId(),
      BananaConfig.getApiUrl()
    );
    if (!BananaConfig.getApiKey()) {
      throw new Error("API key is not set. Please initialize BananaConfig with a valid API key.");
    }
    if (!BananaConfig.getAppId()) {
      throw new Error("App ID is not set. Please initialize BananaConfig with a valid App ID.");
    }
    if (!BananaConfig.getApiUrl()) {
      throw new Error("API URL is not set. Please initialize BananaConfig with a valid API URL.");
    }
  }

  async fetchAppConfig() {
    console.log("xxxxxx", BananaConfig.getApiKey(), BananaConfig.getAppId(), BananaConfig.getApiUrl());
    const numOfRetries = 5;
    const retryDelay = 2000; // 2 seconds
    const appId = BananaConfig.getAppId();
    let path = `${appId}/app-datas`;

    this.validateEnv();

    const fetchData = async () => {
      try {
        const response = await fetch(`${BananaConfig.getApiUrl()}${path}`, {
          method: "GET",
          headers: {
            "x-api-key": BananaConfig.getApiKey(),
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
    const experiments = BananaCache.getKeyValue("experiments") || [];
    const userId_ = BananaCache.getKeyValue("userId")
    console.log("Fetched experiments:", userId_);
    const experimentIds = experiments.map((experiment) => experiment.id);
    if (!experimentIds || !Array.isArray(experimentIds) || experimentIds.length === 0) {
      console.warn("No experiments found or experiment IDs are invalid.");
      // throw new Error("Experiment IDs must be a non-empty array.");
      return
    }
    this.validateEnv();
    // if userId is not set, use sessionId
    const userId = BananaCache.getKeyValue("userId") || BananaCache.getKeyValue("sessionId");
    let path = `${BananaConfig.getAppId()}/user-variants`;

    const fetchData = async () => {
      try {
        const response = await fetch(`${BananaConfig.getApiUrl()}${path}`, {
          method: "POST",
          headers: {
            "x-api-key": BananaConfig.getApiKey(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            experimentIds,
            appId: BananaConfig.getAppId(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user variants: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Fetched user variants:", data);
        return data;
      } catch (error) {
        throw error; // Re-throw the error to handle it in the retry logic
      }
    }
    try {
        const data = await fetchData();
        if (data) {
          return data;
        }
      } catch (error) {
        console.error("Error fetching user variants:", error);
        throw error; // Re-throw the error to handle it in the retry logic
      }
  }
}

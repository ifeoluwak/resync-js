import { BananaConfig } from "./index.js";

const FLUSH_INTERVAL = 5000; // 5 seconds

export class AbTest {
  constructor(experiments) {
    this.experiments = experiments || [];
    this.logs = [];
    this.retryCount = 0;
    const fns = this.experiments
      .map((exp) => exp.assignmentFunction)
      .filter((fn) => fn);
    if (fns.length > 0) {
      BananaConfig.exec.loadFunctions(fns);
    }
    this.timeoutId = setInterval(() => this.flushLogs(), FLUSH_INTERVAL); // Every 5s
  }

  async getVariant(experimentName, ...payload) {
    const experiment = this.experiments.find(
      (exp) => exp.name === experimentName
    );
    if (!experiment) return null;

    const { variants } = experiment;
    const weights = variants
      .map((v) => v.weight)
      .filter((w) => w != null && !isNaN(w) && w > 0);
    if (!variants || variants.length === 0) return null;

    // Does the experiment have custom logic for variant assignment?
    if (experiment.assignmentFunction) {
      const variantValue = await BananaConfig.exec.functionMapper(
        experiment.assignmentFunction.name,
        ...payload
      );
      const variant = experiment.variants.find(
        (v) => v.value === variantValue
      );
      this.logExperiment(experiment.id, variant, "IMPRESSION");
      return variantValue;
    }
    // random assignment if no custom logic
    let idx = 0;
    if (payload.length > 0) {
      const hash = this.#hashString(payload.join("") + experimentName);
      console.log("Hash for experiment", experimentName, ":", hash);
      if (weights && weights.length === variants.length) {
        console.log("Using weighted assignment for experiment", weights);
        // Weighted assignment
        let sum = 0;
        const r = (hash % 10000) / 10000;
        for (let i = 0; i < weights.length; i++) {
          sum += weights[i];
          if (r < sum) {
            idx = i;
            break;
          }
        }
      } else {
        console.log("No weights or mismatched length, using simple hash");
        idx = hash % variants.length;
      }
    } else {
      // Fallback: random
      idx = Math.floor(Math.random() * variants.length);
    }
    return variants[idx].value;
  }

  #hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) + hash + str.charCodeAt(i);
    }
    return Math.abs(hash);
  }

  logExperiment(experimentId, variant, type) {
    const apiKey = BananaConfig.getApiKey();
    const appId = BananaConfig.getAppId();
    const appUrl = BananaConfig.getApiUrl();
    if (!apiKey || !appId || !appUrl) {
      console.warn(
        "API key, App ID, or App URL not set. Skipping log exposure."
      );
      return;
    }
    const logEntry = {
      type,
      experimentId,
      variant,
      sessionId: BananaConfig.sessionId,
      timestamp: new Date().toISOString(),
      client: BananaConfig.client,
      metadata: BananaConfig.attributes,
    };
    console.log("Logging experiment entry:", logEntry);
    // return
    fetch(`${appUrl}${appId}/${experimentId}/log-experiment`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logEntry),
    })
      .then((response) => {
        if (!response.ok) {
          console.error("A/B Failed to send log entry:", response.statusText);
          this.saveLogForLaterUpload([logEntry]);
          return;
        }
        console.log("A/B Log entry sent successfully 11111:", logEntry);
      })
      .catch((error) => {
        console.error("A/B Logging failed:", error);
        this.saveLogForLaterUpload([logEntry]);
      });
  }

  saveLogForLaterUpload(logEntrys) {
    // Add to logs (circular buffer for memory safety)
    this.logs.unshift(...logEntrys);
    if (this.logs.length > 1000) {
      this.logs.pop();
    }
    if (!this.timeoutId) {
      console.log("No timeout set, setting a new one");
      this.timeoutId = setTimeout(() => this.flushLogs(), FLUSH_INTERVAL); // Reset timeout
    }
  }

  async flushLogs() {
    if (this.logs.length === 0) {
      console.log(
        "A/B No stats to flush",
        { timeoutId: this.timeoutId },
        this.logs
      );
      clearInterval(this.timeoutId);
      // this.timeoutId = null;
      return;
    }

    if (this.retryCount > 5) {
      console.warn("A/B Too many retries, stopping flush");
      clearInterval(this.timeoutId);
      // this.timeoutId = null;
      return;
    }

    this.retryCount++;

    const BATCH_SIZE = 100;
    const batch = this.logs.splice(0, BATCH_SIZE);

    this.sendLogsToBackend(batch);
  }

  sendLogsToBackend(batchEntries) {
    const apiKey = BananaConfig.getApiKey();
    const appId = BananaConfig.getAppId();
    const appUrl = BananaConfig.getApiUrl();
    if (!apiKey || !appId || !appUrl) {
      console.warn(
        "API key, App ID, or App URL not set. Skipping log exposure."
      );
      return;
    }
    fetch(`${appUrl}${appId}/log-experiment/batch`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batchEntries),
    })
      .then((response) => {
        if (!response.ok) {
          return;
        }
        console.log(
          "A/B Log entry sent successfully 33333:",
          batchEntries.count
        );
        this.executionLogs = this.executionLogs.filter(
          (log) => !batchEntries.some((entry) => entry.id === log.id)
        );
      })
      .catch((error) => {
        console.error("A/B Logging failed:", error);
        this.saveLogForLaterUpload(batchEntries);
      });
  }
}

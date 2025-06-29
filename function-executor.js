import { FunctionTracker } from "./function-tracker.js";

  /**
   * Loads the application configuration from the Banana API.
   * @returns {FunctionExecutor} - Returns an instance of FunctionExecutor with the loaded configuration.
   * @throws {Error} If the API key is not set or if the fetch fails.
   */
export class FunctionExecutor extends FunctionTracker {
  /**
   * Creates an instance of FunctionExecutor.
   * @param {BananaCache} cache - The cache instance containing functions and settings.
   * @throws {Error} If the cache instance is not provided.
   */
  constructor(cache, {
    key,
    appUrl,
    appId,
  }) {
    if (!cache) {
        throw new Error("Cache instance is required for FunctionExecutor");
    }
    super({ key, appUrl, appId });

    /**
     * @type {import("./cache.js").Function[]}
     */
    this.functions = cache.functions || [];
    /**
     * @type {import("./cache.js").FunctionSetting}
     */
    this.settings = cache.functionSettings || {};
    /**
     * @type {import("./cache.js").Config}
     */
    this.config = cache.configs.config || {};

    /**
     * @type {Map<string, import("./cache.js").Function>}
     */
    this.functionMap = new Map();
    this.fetchCount = 0;
    // this.startMemory = performance.memory?.usedJSHeapSize || 0;

    this.currentFetchCount = 0;

    this.calledBy = null;

    this.initializeFunctionAndStatsMap();
  }

  initializeFunctionAndStatsMap() {
    if (!this.functionMap.size) {
      // Initialize with your functions
      this.functions.forEach((fn) => {
        this.functionMap.set(fn.name, fn);
      });
    }
  }

  // Secure fetch implementation
  get safeFetch() {
    return async (url, options = {}) => {
      // Safety checks
      if (++this.fetchCount > this.config.maxFetchCount) {
        throw new Error(`Fetch limit exceeded (max ${this.config.maxFetchCount})`);
      }

      if (options.method && options.method !== "GET") {
        throw new Error("Only GET requests are allowed");
      }

      if (
        !this.config.allowedExternalApiDomains.some((domain) => url.startsWith(domain))
      ) {
        throw new Error(`Domain not whitelisted: ${new URL(url).hostname}`);
      }

      return fetch(url, { ...options, method: "GET" });
    };
  }


  // Code validation
  validateCode(code) {
    const bannedPatterns = [
      /Config\.SECRET/g,
      /eval\(/,
      /new Function\(/,
      /while\s*\(/,
      /for\s*\([^)]*;\)/,
      //   /process|require|import/i, // No Node.js access
      //   /window|document|globalThis/i, // No browser globals
      //   /exec|spawn|child_process/i, // No child processes
      //   /fs|fileSystem|readFile|writeFile/i, // No file system access
      //   /XMLHttpRequest/i, // No XHR access
      //   /importScripts/i, // No web worker scripts,
      //   /location|history|navigator/i, // No browser navigation
      //   /localStorage|sessionStorage/i, // No storage access
      //   /WebSocket|Socket|io\./i, // No WebSocket access
      //   /crypto|btoa|atob/i, // No crypto functions
      //   /alert|confirm|prompt/i, // No user prompts
      //   /setTimeout|setInterval|clearTimeout|clearInterval/i, // No timers
      //   /eval\(/, // No eval
      //   /Function\(/, // No Function constructor
      //   /import\(/, // No dynamic imports
      //   /process\.env/i, // No access to environment variables
      //   /__dirname|__filename/i, // No access to file paths
      //   /globalThis|window|document/i, // No global objects
      //   /new\s+Error\(/, // No custom errors
      //   /console\.(log|warn|error|info)/ // No console access
    ];

    (this.config.bannedKeywords || bannedPatterns).forEach((pattern) => {
      if (pattern.test(code)) {
        throw new Error(`Unsafe code pattern detected: ${pattern.source}`);
      }
    });
  }

  // Secure function wrapper
  async executeFunction(fnDef, ...args) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error(`Timeout after ${this.config.maxExecutionDurationMs}ms`)),
        this.config.maxExecutionDurationMs
      );
    });

    const executionStart = performance.now();
    let executionSuccessful = false;
    let result;
    let error = null;
    let timestamp = new Date().toISOString()

    this.fetchCount = 0;

    try {
      this.validateCode(fnDef.code);

      // Create limited config subset
      const limitedConfig = fnDef.constants?.reduce((acc, key) => {
        if (this.config[key] === undefined)
          throw new Error(`Invalid config key: ${key}`);
        return { ...acc, [key]: Config[key] };
      }, {});

      // Secure environment
      const env = {
        Config: Object.freeze(limitedConfig),
        fetch: this.safeFetch,
        // console: { log: () => {} }, // Neutralized console
        setTimeout: () => {
          throw new Error("setTimeout not allowed");
        },
        setInterval: () => {
          throw new Error("setInterval not allowed");
        },
      };

      const paramNames = fnDef.parameters.map((p) => p.name);

      const parameters = [...paramNames, ...Object.keys(env)];
      const values = [...args, ...Object.values(env)];

      const AsyncFunction = async function () {}.constructor;
      const userFn = new AsyncFunction(...parameters, fnDef.code);

      result = await Promise.race([userFn(...values), timeoutPromise]);

      executionSuccessful = true;

      if (fnDef.calls) {
        this.calledBy = fnDef.name;
        return await this.executeFunction(fnDef.calls, result);
      }

      console.log(`Function ${fnDef.name} executed successfully`, {result, args});

      return result;
    } catch (err) {
      error = err;
      throw error; // Re-throw for caller to handle
    } finally {
      // Clear timeout if function executed successfully
      clearTimeout(timeoutId);
      // Always update statistics, even if error occurred
      const duration = performance.now() - executionStart;

      // Log the execution
      this.logExecution({
        timestamp,
        functionId: fnDef.id,
        version: fnDef.version,
        calledBy: this.calledBy,
        arguments: JSON.stringify(args),
        result: error ? null : JSON.stringify(result),
        error: error ? error.message : null,
        durationMs: parseFloat(duration.toFixed(3)), // Duration in milliseconds
      });

      this.calledBy = null;
    }
  }

  // Function mapper
  functionMapper(fnName, ...args) {
    const fnDef = this.functionMap.get(fnName);
    if (!fnDef) throw new Error(`Function ${fnName} not found`);

    return this.executeFunction(fnDef, ...args);
  }
}
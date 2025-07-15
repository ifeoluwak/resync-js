import { FunctionTracker } from "./function-tracker.js";
import { BananaConfig } from "./index.js";

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
  constructor(cache) {
    if (!cache) {
      throw new Error("Cache instance is required for FunctionExecutor");
    }
    super();

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

    this.#initializeFunctionAndStatsMap();
  }

  #initializeFunctionAndStatsMap() {
    if (!this.functionMap.size) {
      // Initialize with your functions
      this.functions.forEach((fn) => {
        this.functionMap.set(fn.name, fn);
      });
    }
  }

  /**
   * Provides a safe fetch implementation that adheres to the settings.
   * @returns {Function} - A function that performs a safe fetch operation.
   * @throws {Error} If the fetch operation exceeds the maximum count or if the URL is not whitelisted.
   * @description This method returns a fetch function that checks the settings for
   * allowed external API domains and maximum fetch count.
   * It ensures that only GET requests are allowed and that the URL is whitelisted.
   */
  get safeFetch() {
    return async (url, options = {}) => {
      // Safety checks
      // if (++this.fetchCount > this.settings.maxFetchCount) {
      //   throw new Error(`Fetch limit exceeded (max ${this.settings.maxFetchCount})`);
      // }

      if (options.method && options.method !== "GET") {
        throw new Error("Only GET requests are allowed");
      }

      if (
        !this.settings.allowedExternalApiDomains.some((domain) =>
          url.startsWith(domain)
        )
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

    this.settings.bannedKeywords.forEach((keyword) => {
      if (code.includes(keyword)) {
        throw new Error(`Unsafe code keyword detected: ${keyword}`);
      }
    });
    this.settings.bannedPatterns.forEach((pattern) => {
      if (new RegExp(pattern).test(code)) {
        throw new Error(`Unsafe code pattern detected: ${pattern}`);
      }
    });
  }

  /**
   * Executes a function with the provided definition and arguments.
   * @param {import("./cache.js").Function} fnDef - The function definition to execute.
   * @param {...*} args - The arguments to pass to the function.
   * @returns {Promise<*>} - The result of the function execution.
   * @throws {Error} If the function execution fails or times out.
   * @description This method executes a function with the provided definition and arguments.
   * It validates the function code, sets up a secure environment, and executes the function.
   * It also handles timeouts and logs the execution details.
   * If the function has nested calls, it recursively executes them.
   * It uses a secure fetch implementation and ensures that the function adheres to the defined settings.
   * The function execution is wrapped in a timeout to prevent long-running executions.
   */
  async executeFunction(fnDef, ...args) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () =>
          reject(
            new Error(`Timeout after ${this.settings.maxExecutionDurationMs}ms`)
          ),
        this.settings.maxExecutionDurationMs
      );
    });

    const executionStart = performance.now();
    let executionSuccessful = false;
    let result;
    let error = null;
    let timestamp = new Date().toISOString();

    this.fetchCount = 0;

    try {
      this.validateCode(fnDef.code);

      // Create limited config subset
      const limitedConfig = JSON.stringify(this.config, fnDef.constants);

      // Secure environment
      const env = {
        BananasConfig: Object.freeze(JSON.parse(limitedConfig)),
        fetch: this.settings.allowFetch
          ? this.safeFetch
          : () => {
              throw new Error("Fetch not allowed");
            },
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
        this.calledBy = fnDef.id;
        return await this.executeFunction(fnDef.calls, result);
      }

      console.log(`Function ${fnDef.name} executed successfully`, {
        result,
        args,
      });

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
        calledById: this.calledBy,
        arguments: JSON.stringify(args),
        result: error ? null : JSON.stringify(result),
        error: error ? error.message : null,
        durationMs: parseFloat(duration.toFixed(3)), // Duration in milliseconds
        client: BananaConfig.client,
        attributes: BananaConfig.attributes,
        sessionId: BananaConfig.sessionId,
      });

      this.calledBy = null;
    }
  }

  /**
   * Load functions into the FunctionExecutor.
   * This allows the A/B testing framework to use custom functions for variant assignment.
   * @param {Array} fns - The list of functions to load.
   * @description This method loads the functions into the FunctionExecutor.
   */
  loadFunctions(fns) {
    fns.forEach((fn) => {
      this.functionMap.set(fn.name, fn);
    });
  }

  /**
   * Executes a function by its name with the provided arguments.
   * @param {string} fnName - The name of the function to execute.
   * @param {...*} args - The arguments to pass to the function.
   * @returns {Promise<*>} - The result of the function execution.
   * @throws {Error} If the function is not found or if execution fails.
   */
  functionMapper(fnName, ...args) {
    const fnDef = this.functionMap.get(fnName);
    if (!fnDef) throw new Error(`Function ${fnName} not found`);

    return this.executeFunction(fnDef, ...args);
  }
}

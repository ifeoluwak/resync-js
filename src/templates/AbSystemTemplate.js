import ResyncCache from "../core/ResyncCache.js";
import { TIMING_CONFIG } from "../utils/constants.js";

function hashUserId(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * TIMING_CONFIG.HASH_MULTIPLIER + userId.charCodeAt(i)) % TIMING_CONFIG.HASH_MODULO;
  }
  return hash;
}

// Weighted rollout: supports even or uneven splits
export const weightedRolloutTemplate = (experiment) => {
  const { variants, rolloutPercent } = experiment;
  const userId = ResyncCache.getKeyValue("userId") || ResyncCache.getKeyValue("sessionId");
  const hash = hashUserId(userId);

  // Only users with hash < rolloutPercent are in the rollout
  if (hash >= rolloutPercent) {
    // Assign the default or first variant as default
    return variants.find(v => v.default)?.value || variants[0].value;
  }

  // Assign based on weights (weights can be even or uneven)
  const totalWeight = variants.reduce((acc, v) => acc + v.weight, 0);
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += (variant.weight / totalWeight) * rolloutPercent;
    if (hash < cumulative) {
      return variant.value;
    }
  }
  // Fallback: return last variant
  return variants[variants.length - 1].value;
};

// Feature flag rollout: simple on/off (control/treatment)
export const featureFlagRolloutTemplate = (experiment) => {
  const { variants, rolloutPercent } = experiment;
  const userId = ResyncCache.getKeyValue("userId") || ResyncCache.getKeyValue("sessionId");
  const treatmentValue = variants.find(v => v.default)?.value;
  const controlValue = variants.find(v => !v.default)?.value;
  const hash = hashUserId(userId);
  return hash < rolloutPercent ? treatmentValue : controlValue;
};

// Stateless: Does NOT require event history
export const weightedRandom = (experiment) => {
  const { variants } = experiment;
  const totalWeight = variants.reduce((acc, variant) => {
    return acc + variant.weight;
  }, 0);
  const random = Math.random() * totalWeight;
  let cumulativeWeight = 0;
  for (const variant of variants) {
    cumulativeWeight += variant.weight;
    if (random <= cumulativeWeight) {
      return variant.value;
    }
  }
  return variants.find((variant) => variant.default)?.value;
};

// Stateless: Does NOT require event history
// For seasonal campaigns
export const getTimeVariant = (experiment) => {
  const { variants, dateSettings } = experiment;
  const mainVariant = variants.find(v => v.default);
  const defaultVariant = variants.find(v => !v.default);

  const now = new Date();
  const startDate = new Date(dateSettings.startDate);
  const endDate = new Date(dateSettings.endDate);

  return now >= startDate && now <= endDate
    ? mainVariant.value
    : defaultVariant.value;
};

// Map of system template IDs to their respective functions to be called locally
export const systemTemplatesIdMap = {
  "weighted-rollout": 'weightedRolloutTemplate',
  "feature-flag-rollout": 'featureFlagRolloutTemplate',
  "weighted-random": 'weightedRandom',
  "time-based": 'getTimeVariant',
};

// Require api calls to determine variant
export const backendSystemTemplatesIds = ['bandit-epsilon-greedy', 'round-robin']
import ResyncCache from "../core/ResyncCache.js";
import { TIMING_CONFIG } from "../utils/constants.js";

/**
 * Hash a userId using DJB2 algorithm with salting for better distribution.
 * Ensures uniform distribution regardless of userId format (numeric strings, UUIDs, etc.)
 * @param {string} userId - The user identifier (always a string)
 * @returns {number} Hash value between 0 and HASH_MODULO-1
 */
function hashUserId(userId) {
  // Add salt prefix for better distribution, especially for short numeric IDs like "1", "2", "3"
  const saltedUserId = `resync_${userId}_salt`;
  
  // DJB2 hash algorithm - provides excellent distribution
  let hash = 5381; // Magic number for DJB2
  
  for (let i = 0; i < saltedUserId.length; i++) {
    const char = saltedUserId.charCodeAt(i);
    // hash * 33 + char (bit shift is faster than multiplication)
    hash = ((hash << 5) + hash) + char;
  }
  
  // Ensure positive value and modulo to range
  return Math.abs(hash) % TIMING_CONFIG.HASH_MODULO;
}

/**
 * Assigns a variant to a user based on the weighted rollout algorithm.
 * @param {string} userId - The user identifier (always a string)
 * @param {Array<{weight: number, contentViewId: number}>} variants - The variants to assign to the user
 * @returns {number|null} The content view id of the assigned variant or null if no variants are provided
 */
function assignVariant(userId, variants) {
  if (variants.length === 0) {
    return null;
  }
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight <= 0) {
    throw new Error('Total weight must be greater than 0');
  }
  
  // Normalize weights to sum to 1
  const normalizedVariants = variants.map(v => ({
    contentViewId: v.contentViewId,
    weight: v.weight / totalWeight,
  })).filter(v => v.contentViewId !== null);
  
  // Hash the userId and normalize to 0-1 range
  const hashValue = hashUserId(userId);
  const normalizedHash = hashValue / TIMING_CONFIG.HASH_MODULO;
  
  // Find which bucket the normalized hash falls into
  let cumulative = 0;
  for (const v of normalizedVariants) {
    cumulative += v.weight;
    if (normalizedHash < cumulative) {
      return v.contentViewId;
    }
  }
  
  // Fallback (shouldn't happen with proper normalization)
  return normalizedVariants[normalizedVariants.length - 1].contentViewId;
}

/**
 * Assigns a variant (content view id) to a user based on the weighted rollout algorithm.
 * This is a template for the weighted rollout algorithm.
 * @param {Campaign} campaign - The campaign to assign a variant to.
 * @returns {number|null} The content view id of the assigned variant or null if no variants are provided
 */
export const weightedRolloutTemplate = (campaign) => {
  let variants = [{
    weight: campaign.controlWeight,
    contentViewId: campaign.controlContentId,
  }, {
    weight: campaign.variantAWeight,
    contentViewId: campaign.variantAContentId,
  }];
  if (campaign?.variantBWeight && campaign.variantBContentId) {
    variants.push({
      weight: campaign.variantBWeight,
      contentViewId: campaign.variantBContentId,
    });
  }
  const userId = ResyncCache.getKeyValue("userId") || ResyncCache.getKeyValue("sessionId");

  // Only users with hash < rolloutPercent are in the rollout
  // if (hash >= rolloutPercent) {
  //   // Assign the default or first variant as default
  //   return variants.find(v => v.default)?.value || variants[0].value;
  // }
  return assignVariant(userId, variants);
};

// Map of system template IDs to their respective functions to be called locally
export const systemTemplatesIdMap = {
  "weighted-rollout": 'weightedRolloutTemplate',
};

// Require api calls to determine variant
export const backendSystemTemplatesIds = ['bandit-epsilon-greedy', 'round-robin']
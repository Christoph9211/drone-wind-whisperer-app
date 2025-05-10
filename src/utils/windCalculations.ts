
/**
 * Wind calculation utilities for drone operations
 */

// Constants for wind safety thresholds
export const MAX_SAFE_WIND = 11.0; // m/s
export const MAX_SAFE_GUST = 12.0; // m/s

/**
 * Convert wind speed from mph to m/s
 * @param mph Wind speed in miles per hour
 * @returns Wind speed in meters per second
 */
export const mphToMs = (mph: number): number => {
  return mph * 0.44704;
};

/**
 * Convert wind speed from m/s to mph
 * @param ms Wind speed in meters per second
 * @returns Wind speed in miles per hour
 */
export const msToMph = (ms: number): number => {
  return ms / 0.44704;
};

/**
 * Estimate wind speed at a given altitude using the power law profile
 * @param referenceSpeed Wind speed at reference height (usually 10m)
 * @param referenceHeight Reference height in meters (default: 10m)
 * @param targetHeight Target height in meters
 * @param alpha Hellman exponent (default: 1/7 for open terrain)
 * @returns Estimated wind speed at target height
 */
export const estimateWindAtHeight = (
  referenceSpeed: number,
  referenceHeight: number = 10,
  targetHeight: number,
  alpha: number = 1/7
): number => {
  return referenceSpeed * Math.pow(targetHeight / referenceHeight, alpha);
};

/**
 * Check if wind conditions are safe for drone operations
 * @param windSpeed Wind speed in m/s
 * @param gustSpeed Gust speed in m/s, optional
 * @returns Boolean indicating if conditions are safe
 */
export const isSafeForDrones = (windSpeed: number, gustSpeed?: number): boolean => {
  if (windSpeed > MAX_SAFE_WIND) {
    return false;
  }
  
  if (gustSpeed !== undefined && gustSpeed > MAX_SAFE_GUST) {
    return false;
  }
  
  return true;
};

/**
 * Format wind speed for display with appropriate units
 * @param speed Wind speed in m/s
 * @returns Formatted string with both m/s and mph
 */
export const formatWindSpeed = (speed: number): string => {
  const mph = msToMph(speed);
  return `${speed.toFixed(1)} m/s (${mph.toFixed(1)} mph)`;
};

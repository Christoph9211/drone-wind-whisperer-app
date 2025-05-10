
import { mphToMs } from './windCalculations';

// Constants for the API endpoint
const NWS_API_BASE_URL = 'https://api.weather.gov';
const DEFAULT_LOCATION = {
  latitude: 38.01,
  longitude: -92.17,
  timezone: 'America/Chicago'
};

export interface WindData {
  timestamp: Date;
  windSpeed: number; // in m/s
  windDirection?: number;
  windGust?: number; // in m/s
  isDaytime: boolean;
}

interface NWSForecastPeriod {
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  detailedForecast: string;
}

interface NWSHourlyForecast {
  periods: NWSForecastPeriod[];
}

/**
 * Parse wind speed from NWS format (e.g., "10 mph") to number in mph
 */
const parseWindSpeed = (speedText: string): number => {
  const match = speedText.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

/**
 * Fetch forecast data from the National Weather Service API
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Array of WindData objects
 */
export const fetchNWSForecast = async (
  latitude = DEFAULT_LOCATION.latitude, 
  longitude = DEFAULT_LOCATION.longitude
): Promise<WindData[]> => {
  try {
    // Step 1: Get the grid points for the location
    const pointResponse = await fetch(
      `${NWS_API_BASE_URL}/points/${latitude},${longitude}`
    );
    
    if (!pointResponse.ok) {
      throw new Error(`NWS API error: ${pointResponse.status} ${pointResponse.statusText}`);
    }
    
    const pointData = await pointResponse.json();
    const { gridId, gridX, gridY } = pointData.properties;
    
    // Step 2: Get the hourly forecast using grid points
    const forecastResponse = await fetch(
      `${NWS_API_BASE_URL}/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly`
    );
    
    if (!forecastResponse.ok) {
      throw new Error(`NWS API error: ${forecastResponse.status} ${forecastResponse.statusText}`);
    }
    
    const forecastData = await forecastResponse.json();
    const periods = forecastData.properties.periods;
    
    // Process forecast data
    const windData: WindData[] = periods.map((period: NWSForecastPeriod) => {
      const windSpeedMph = parseWindSpeed(period.windSpeed);
      // TODO: Parse gust data if available in the future
      
      return {
        timestamp: new Date(period.startTime),
        windSpeed: mphToMs(windSpeedMph), // Convert to m/s
        windDirection: getDirectionDegrees(period.windDirection),
        windGust: undefined, // NWS API doesn't provide gust data in hourly forecast
        isDaytime: period.isDaytime
      };
    });
    
    return windData;
    
  } catch (error) {
    console.error('Error fetching NWS forecast:', error);
    throw error;
  }
};

/**
 * Convert cardinal direction to degrees
 */
const getDirectionDegrees = (direction: string): number => {
  const directions: Record<string, number> = {
    'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
    'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
    'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
    'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
  };
  
  return directions[direction] || 0;
};

/**
 * Check if a given time is during daylight hours
 * @param date Date object to check
 * @returns Boolean indicating if it's daytime
 */
export const isDaylight = (date: Date): boolean => {
  const hour = date.getHours();
  return hour >= 6 && hour < 20; // Simple approximation (6am to 8pm)
};

/**
 * Filter forecast data for daylight hours
 * @param windData Array of wind data points
 * @returns Filtered array with only daylight hours
 */
export const filterDaylightHours = (windData: WindData[]): WindData[] => {
  return windData.filter(data => data.isDaytime);
};

/**
 * Generate mock data for testing when API is unavailable
 * @returns Array of mock WindData objects
 */
export const generateMockWindData = (): WindData[] => {
  const now = new Date();
  const data: WindData[] = [];
  
  // Generate 48 hours of mock data
  for (let i = 0; i < 48; i++) {
    const timestamp = new Date(now);
    timestamp.setHours(now.getHours() + i);
    
    const isDaytime = timestamp.getHours() >= 6 && timestamp.getHours() < 20;
    
    // Create some variation in wind speeds
    const baseSpeed = 5 + Math.sin(i / 6) * 4 + Math.random() * 2;
    const gustFactor = 1 + Math.random() * 0.5;
    
    data.push({
      timestamp,
      windSpeed: baseSpeed,
      windDirection: (i * 15) % 360,
      windGust: baseSpeed * gustFactor,
      isDaytime
    });
  }
  
  return data;
};


import { mphToMs } from './windCalculations';
import { DEFAULT_LOCATION } from './constants';

// Constants for the API endpoint
const NWS_API_BASE_URL = 'https://api.weather.gov';

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
 * Calculate sunset time for a given date and location
 * Uses a simple astronomical formula
 * 
 * @param date Date to calculate sunset for
 * @param latitude Latitude of location
 * @param longitude Longitude of location
 * @returns Date object representing sunset time
 */
export const calculateSunset = (
  date: Date, 
  latitude = DEFAULT_LOCATION.latitude,
  longitude = DEFAULT_LOCATION.longitude
): Date => {
  // Simple approximation formula for sunset
  // More accurate calculations would require a specialized library
  
  // Day of year (0-365)
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // Calculate solar declination
  const declination = 0.4095 * Math.sin(0.016906 * (dayOfYear - 80.086));
  
  // Calculate sunset hour angle
  const sunsetHourAngle = Math.acos(-Math.tan(latitude * Math.PI / 180) * Math.tan(declination));
  
  // Convert to hours, add solar noon (12), and adjust for longitude
  const sunsetHour = 12 + (sunsetHourAngle * 180 / Math.PI) / 15;
  
  // Adjust for longitude (4 minutes per degree from reference longitude)
  const timeZoneOffset = -5; // Central Time (UTC-5)
  const longitudeTime = longitude / 15;
  const localSunsetHour = sunsetHour - longitudeTime - timeZoneOffset;
  
  // Create sunset date
  const sunset = new Date(date);
  sunset.setHours(Math.floor(localSunsetHour));
  sunset.setMinutes(Math.round((localSunsetHour % 1) * 60));
  sunset.setSeconds(0);
  sunset.setMilliseconds(0);
  
  return sunset;
};

/**
 * Calculate sunrise time for a given date and location
 * Uses a simple astronomical formula
 * 
 * @param date Date to calculate sunrise for
 * @param latitude Latitude of location
 * @param longitude Longitude of location
 * @returns Date object representing sunrise time
 */
export const calculateSunrise = (
  date: Date,
  latitude = DEFAULT_LOCATION.latitude,
  longitude = DEFAULT_LOCATION.longitude
): Date => {
  // Simple approximation formula for sunrise
  // More accurate calculations would require a specialized library
  
  // Day of year (0-365)
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // Calculate solar declination
  const declination = 0.4095 * Math.sin(0.016906 * (dayOfYear - 80.086));
  
  // Calculate sunrise hour angle (negative of sunset hour angle)
  const sunriseHourAngle = -Math.acos(-Math.tan(latitude * Math.PI / 180) * Math.tan(declination));
  
  // Convert to hours, add solar noon (12), and adjust for longitude
  const sunriseHour = 12 + (sunriseHourAngle * 180 / Math.PI) / 15;
  
  // Adjust for longitude (4 minutes per degree from reference longitude)
  const timeZoneOffset = -5; // Central Time (UTC-5)
  const longitudeTime = longitude / 15;
  const localSunriseHour = sunriseHour - longitudeTime - timeZoneOffset;
  
  // Create sunrise date
  const sunrise = new Date(date);
  sunrise.setHours(Math.floor(localSunriseHour));
  sunrise.setMinutes(Math.round((localSunriseHour % 1) * 60));
  sunrise.setSeconds(0);
  sunrise.setMilliseconds(0);
  
  return sunrise;
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
      const timestamp = new Date(period.startTime);
      // Use isDaylight function to determine if it's daytime
      
      return {
        timestamp,
        windSpeed: mphToMs(windSpeedMph), // Convert to m/s
        windDirection: getDirectionDegrees(period.windDirection),
        windGust: undefined, // NWS API doesn't provide gust data in hourly forecast
        isDaytime: isDaylight(timestamp, latitude, longitude)
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
 * @param latitude Latitude for sunset calculation
 * @param longitude Longitude for sunset calculation
 * @returns Boolean indicating if it's daytime
 */
export const isDaylight = (
  date: Date, 
  latitude = DEFAULT_LOCATION.latitude,
  longitude = DEFAULT_LOCATION.longitude
): boolean => {
  const sunrise = calculateSunrise(date, latitude, longitude);
  const sunset = calculateSunset(date, latitude, longitude);
  
  return date >= sunrise && date <= sunset;
};

/**
 * Filter forecast data for daylight hours
 * @param windData Array of wind data points
 * @param latitude Latitude for sunset calculation
 * @param longitude Longitude for sunset calculation
 * @returns Filtered array with only daylight hours
 */
export const filterDaylightHours = (
  windData: WindData[],
  latitude = DEFAULT_LOCATION.latitude,
  longitude = DEFAULT_LOCATION.longitude
): WindData[] => {
  return windData.filter(data => 
    isDaylight(data.timestamp, latitude, longitude)
  );
};

/**
 * Generate mock data for testing when API is unavailable
 * @returns Array of mock WindData objects
 */
export const generateMockWindData = (
  latitude = DEFAULT_LOCATION.latitude,
  longitude = DEFAULT_LOCATION.longitude
): WindData[] => {
  const now = new Date();
  const data: WindData[] = [];
  
  // Generate 48 hours of mock data
  for (let i = 0; i < 48; i++) {
    const timestamp = new Date(now);
    timestamp.setHours(now.getHours() + i);
    
    // Check if it's daytime using our new function
    const isDaytimeValue = isDaylight(timestamp, latitude, longitude);
    
    // Create some variation in wind speeds
    const baseSpeed = 5 + Math.sin(i / 6) * 4 + Math.random() * 2;
    const gustFactor = 1 + Math.random() * 0.5;
    
    data.push({
      timestamp,
      windSpeed: baseSpeed,
      windDirection: (i * 15) % 360,
      windGust: baseSpeed * gustFactor,
      isDaytime: isDaytimeValue
    });
  }
  
  return data;
};

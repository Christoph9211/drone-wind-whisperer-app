

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

interface NWSObservation {
  properties: {
    timestamp: string;
    windSpeed: {
      value: number | null;
    };
    windDirection: {
      value: number | null;
    };
    windGust: {
      value: number | null;
    };
  };
}

interface NWSStation {
  properties: {
    stationIdentifier: string;
    name: string;
    timeZone: string;
    elevation: {
      value: number;
    };
  };
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
      
      return {
        timestamp: new Date(period.startTime),
        windSpeed: mphToMs(windSpeedMph), // Convert to m/s
        windDirection: getDirectionDegrees(period.windDirection),
        windGust: undefined, // NWS API doesn't provide gust data in hourly forecast
        isDaytime: isDaylight(new Date(period.startTime))
      };
    });
    
    return windData;
    
  } catch (error) {
    console.error('Error fetching NWS forecast:', error);
    throw error;
  }
};

/**
 * Fetch observation stations near a location
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Array of stations with their details
 */
export const fetchNearbyStations = async (
  latitude = DEFAULT_LOCATION.latitude, 
  longitude = DEFAULT_LOCATION.longitude
): Promise<NWSStation[]> => {
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
    
    // Step 2: Get nearby observation stations
    const stationsResponse = await fetch(
      `${NWS_API_BASE_URL}/gridpoints/${gridId}/${gridX},${gridY}/stations`
    );
    
    if (!stationsResponse.ok) {
      throw new Error(`NWS API error: ${stationsResponse.status} ${stationsResponse.statusText}`);
    }
    
    const stationsData = await stationsResponse.json();
    return stationsData.features || [];
    
  } catch (error) {
    console.error('Error fetching nearby stations:', error);
    throw error;
  }
};

/**
 * Fetch observations from a specific station
 * @param stationId Station identifier
 * @returns Recent observations from the station
 */
export const fetchStationObservations = async (stationId: string): Promise<NWSObservation[]> => {
  try {
    const observationsResponse = await fetch(
      `${NWS_API_BASE_URL}/stations/${stationId}/observations?limit=24`
    );
    
    if (!observationsResponse.ok) {
      throw new Error(`NWS API error: ${observationsResponse.status} ${observationsResponse.statusText}`);
    }
    
    const observationsData = await observationsResponse.json();
    return observationsData.features || [];
    
  } catch (error) {
    console.error('Error fetching station observations:', error);
    throw error;
  }
};

/**
 * Merge forecast data with observation data to include gust information
 * @param forecastData Forecast wind data
 * @param observationData Observation data which includes gusts
 * @returns Enhanced wind data with gust information where available
 */
export const mergeWindDataWithObservations = (
  forecastData: WindData[], 
  observationData: NWSObservation[]
): WindData[] => {
  if (!observationData.length) return forecastData;
  
  const observationMap = new Map<string, number>();
  
  // Create a map of observations by hour
  observationData.forEach(obs => {
    if (obs.properties.windGust.value !== null) {
      const timestamp = new Date(obs.properties.timestamp);
      const hourKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}-${timestamp.getHours()}`;
      // Convert from m/s to our standard units (already in m/s from the API)
      observationMap.set(hourKey, obs.properties.windGust.value);
    }
  });
  
  // Merge with forecast data
  return forecastData.map(data => {
    const timestamp = data.timestamp;
    const hourKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}-${timestamp.getHours()}`;
    
    if (observationMap.has(hourKey)) {
      return {
        ...data,
        windGust: observationMap.get(hourKey)
      };
    }
    
    return data;
  });
};

/**
 * Estimate wind gusts based on steady wind speed
 * @param windData Array of wind data points
 * @returns Wind data with estimated gusts
 */
export const estimateWindGusts = (windData: WindData[]): WindData[] => {
  return windData.map(data => {
    if (data.windGust === undefined) {
      // Simple estimation: gusts are typically 30-60% higher than steady wind
      // We'll use a conservative 40% increase as default
      const estimatedGust = data.windSpeed * 1.4;
      return {
        ...data,
        windGust: estimatedGust
      };
    }
    return data;
  });
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
 * Determine if a given time is during daylight hours
 * @param {Date} date Date object to evaluate
 * @returns {boolean} True if daytime, false otherwise
 */
export const isDaylight = (date: Date): boolean => {
  const hour = date.getHours();
  return hour >= 6 && hour <= 20; // 6am to 8pm
};

/**
 * Filter wind data for daylight hours
 * @param {WindData[]} windData Array of wind data points
 * @returns {WindData[]} Filtered array with only daylight hours
 */
export const filterDaylightHours = (windData: WindData[]): WindData[] =>
  windData.filter((data) => isDaylight(data.timestamp));

/**
 * Generate mock wind data for testing
 * @returns Array of mock wind data
 */
export const generateMockWindData = (): WindData[] => {
  const data: WindData[] = [];
  const now = new Date();
  now.setMinutes(0, 0, 0); // Reset to the start of the hour
  
  // Generate 48 hours of data
  for (let i = 0; i < 48; i++) {
    const timestamp = new Date(now.getTime() + i * 60 * 60 * 1000);
    const hour = timestamp.getHours();
    
    // Base wind speed varies by time of day (stronger during daytime)
    let baseSpeed = 5 + Math.random() * 3; // 5-8 m/s base
    if (hour >= 10 && hour <= 16) {
      baseSpeed += 2; // Stronger during midday
    }
    
    // Add some overall variability
    baseSpeed += Math.sin(i / 4) * 2; // Sinusoidal pattern
    
    // Ensure we don't have negative wind speeds
    baseSpeed = Math.max(baseSpeed, 1);
    
    // Sometimes exceed the safety threshold for testing
    if (Math.random() > 0.8) {
      baseSpeed *= 1.5;
    }
    
    // Add gusts (30-60% higher than steady wind)
    const gustFactor = 1.3 + Math.random() * 0.3;
    const gustSpeed = baseSpeed * gustFactor;
    
    data.push({
      timestamp,
      windSpeed: baseSpeed,
      windDirection: Math.floor(Math.random() * 360),
      windGust: gustSpeed,
      isDaytime: isDaylight(timestamp)
    });
  }
  
  return data;
};

// ---------------- Regional Wind Utilities ----------------

export interface CurrentWindPoint {
  latitude: number;
  longitude: number;
  windSpeed: number; // m/s
  windDirection: number;
}

/**
 * Fetch current wind speed and direction for a location using Open-Meteo
 */
export const fetchCurrentWind = async (
  latitude: number,
  longitude: number
): Promise<CurrentWindPoint | null> => {
  try {
    const resp = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    );

    if (!resp.ok) {
      throw new Error(`Open-Meteo error: ${resp.status}`);
    }

    const data = await resp.json();
    const weather = data.current_weather;
    if (!weather) return null;

    // Open-Meteo returns windspeed in km/h, convert to m/s
    const windSpeedMs = weather.windspeed / 3.6;

    return {
      latitude,
      longitude,
      windSpeed: windSpeedMs,
      windDirection: weather.winddirection
    };
  } catch (error) {
    console.error('Error fetching current wind:', error);
    return null;
  }
};

/**
 * Fetch a grid of current wind data around a central location
 */
export const fetchRegionalWindGrid = async (
  centerLat: number,
  centerLon: number,
  range: number = 1,
  step: number = 0.5
): Promise<CurrentWindPoint[]> => {
  const half = range / 2;
  const points: Promise<CurrentWindPoint | null>[] = [];

  for (let lat = centerLat - half; lat <= centerLat + half; lat += step) {
    for (let lon = centerLon - half; lon <= centerLon + half; lon += step) {
      points.push(fetchCurrentWind(lat, lon));
    }
  }

  const results = await Promise.all(points);
  return results.filter((p): p is CurrentWindPoint => p !== null);
};


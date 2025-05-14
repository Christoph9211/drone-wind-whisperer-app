
# API Integration

## National Weather Service API

The application integrates with the National Weather Service (NWS) API to fetch real-time wind data. This integration follows a two-step process:

1. **Get Grid Points**: First, the application sends a request to the NWS API with latitude and longitude coordinates to obtain grid points.
2. **Fetch Hourly Forecast**: Using the grid points obtained in the first step, the application fetches hourly forecast data.

### Code Implementation

The API integration is primarily handled in the `weatherApi.ts` file:

```typescript
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
        isDaytime: period.isDaytime
      };
    });
    
    return windData;
    
  } catch (error) {
    console.error('Error fetching NWS forecast:', error);
    throw error;
  }
};
```

### Data Processing

The API returns wind speeds in mph, which are converted to m/s for consistency across the application:

```typescript
const parseWindSpeed = (speedText: string): number => {
  const match = speedText.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};
```

Wind direction is provided as cardinal directions (e.g., "NW", "SSE") and is converted to degrees:

```typescript
const getDirectionDegrees = (direction: string): number => {
  const directions: Record<string, number> = {
    'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
    'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
    'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
    'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
  };
  
  return directions[direction] || 0;
};
```

### Error Handling

The API integration includes robust error handling:

1. HTTP error responses are caught and thrown with descriptive messages
2. Network failures are logged and propagated
3. The application UI displays error states with retry options
4. Implementation includes error boundaries to prevent cascading failures

### Data Filtering

The application filters wind data to focus on daylight hours (6am to 8pm):

```typescript
export const isDaylight = (date: Date): boolean => {
  const hour = date.getHours();
  return hour >= 6 && hour <= 20; // 6am to 8pm
};

export const filterDaylightHours = (windData: WindData[]): WindData[] =>
  windData.filter((data) => isDaylight(data.timestamp));
```

### WindData Interface

The processed wind data follows this structure:

```typescript
export interface WindData {
  timestamp: Date;       // Time of the forecast
  windSpeed: number;     // Wind speed in m/s
  windDirection?: number; // Direction in degrees (0-360)
  windGust?: number;     // Gust speed in m/s (if available)
  isDaytime: boolean;    // Whether it's daytime according to NWS
}
```

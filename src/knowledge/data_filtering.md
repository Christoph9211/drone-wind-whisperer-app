
# Data Filtering and Processing

## Daylight Hours Filtering

The application filters wind data to focus on daylight hours, which are defined as the hours between 6am and 8pm. This filtering is implemented in the `weatherApi.ts` file:

```typescript
export const isDaylight = (date: Date): boolean => {
  const hour = date.getHours();
  return hour >= 6 && hour <= 20; // 6am to 8pm
};

export const filterDaylightHours = (windData: WindData[]): WindData[] =>
  windData.filter((data) => isDaylight(data.timestamp));
```

The filtering is applied after fetching data from the NWS API:

```typescript
const fetchWindData = async () => {
  setLoading(true);
  setError(null);
  try {
    const data = await fetchNWSForecast(location.latitude, location.longitude);
    const filteredData = filterDaylightHours(data);
    setWindData(filteredData);
    toast.success("Wind data fetched successfully!");
  } catch (err) {
    // Error handling
  } finally {
    setLoading(false);
  }
};
```

## Date-Based Grouping

For multi-day data, the application groups wind data by date to allow users to switch between different days:

```typescript
// Group data by date
const getDateString = (date: Date) => {
  return date.toLocaleDateString();
};

const groupedData = windData.reduce((acc, data) => {
  const dateKey = getDateString(data.timestamp);
  if (!acc[dateKey]) {
    acc[dateKey] = [];
  }
  acc[dateKey].push(data);
  return acc;
}, {} as Record<string, WindData[]>);

// Get unique dates
const dates = Object.keys(groupedData);
```

This grouping is used in the `WindDataTable` component to allow users to view data for specific dates:

```typescript
{dates.length > 1 && (
  <div className="mb-4 flex space-x-2">
    {dates.map(date => (
      <button
        key={date}
        onClick={() => setSelectedDate(date)}
        className={`px-3 py-1 rounded-md ${
          selectedDate === date 
            ? 'bg-primary text-white' 
            : 'bg-gray-200 hover:bg-gray-300'
        }`}
      >
        {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </button>
    ))}
  </div>
)}
```

## Current and Near-Future Data Selection

For the safety indicator, the application focuses on current and near-future data (next two hours):

```typescript
// Filter for current and near-future data
const now = new Date();
const nextTwoHours = windData.filter(data => {
  return data.timestamp >= now && 
        data.timestamp <= new Date(now.getTime() + 2 * 60 * 60 * 1000);
});

// If no near-future data, use the first available
const relevantData = nextTwoHours.length > 0 ? nextTwoHours : windData.slice(0, 2);
```

This ensures that the safety status reflects current conditions rather than historical data.

## Data Transformation for Visualization

For the chart component, the application transforms wind data into a format suitable for Recharts:

```typescript
const chartData: WindChartData[] = windData.map(data => {
  // Calculate estimated wind speeds at different altitudes
  const baseSpeed = data.windSpeed;
  const speed20m = estimateWindAtHeight(baseSpeed, 10, 20);
  const speed50m = estimateWindAtHeight(baseSpeed, 10, 50);
  const speed80m = estimateWindAtHeight(baseSpeed, 10, 80);
  const speed100m = estimateWindAtHeight(baseSpeed, 10, 100);
  const speed120m = estimateWindAtHeight(baseSpeed, 10, 120);
  
  // Convert if needed
  const conversionFactor = showMph ? 1 / 0.44704 : 1;
  
  return {
    time: data.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    wind10m: baseSpeed * conversionFactor,
    wind20m: speed20m * conversionFactor,
    wind50m: speed50m * conversionFactor,
    wind80m: speed80m * conversionFactor,
    wind100m: speed100m * conversionFactor,
    wind120m: speed120m * conversionFactor,
    gust: data.windGust ? data.windGust * conversionFactor : undefined
  };
});
```

## Time Formatting

The application formats time consistently across components:

```typescript
// Format for chart time axis
time: data.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

// Format for table cells
{data.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
```

## Auto-Refresh Mechanism

The application implements an automatic refresh mechanism to ensure data remains current:

```typescript
// Set up automatic refresh interval (every 30 minutes)
const refreshInterval = setInterval(() => {
  fetchWindData();
}, 30 * 60 * 1000);

return () => clearInterval(refreshInterval);
```

This ensures that users always see the most recent wind data without having to manually refresh the page.

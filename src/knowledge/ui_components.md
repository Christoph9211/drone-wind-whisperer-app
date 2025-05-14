
# UI Components

## Main Components

### DroneWindAnalysis (Index.tsx)

This is the main component that renders the entire application. It orchestrates data fetching, state management, and renders all child components:

- Manages state for wind data, loading status, errors, and location
- Handles data fetching and refresh logic
- Provides user feedback through toast notifications
- Implements responsive layout using Tailwind CSS grid system

### WindSpeedChart

Displays wind data in a line chart format using Recharts:

- Shows wind speeds at different altitudes (10m, 20m, 50m, 80m, 100m, 120m)
- Includes reference lines for safety thresholds
- Supports toggling between m/s and mph units
- Optional display for wind gusts
- Interactive tooltips showing precise values

Implementation details:
```jsx
const WindSpeedChart = ({ windData, showMph = false }: WindSpeedChartProps) => {
  // Transforms wind data for charting
  // Renders LineChart from Recharts with multiple Line components
  // Includes reference lines for safety thresholds
}
```

### WindDataTable

Presents wind data in a tabular format:

- Groups data by date
- Shows wind speeds at different heights
- Includes safety indicators (✓/✗) for each height
- Displays an overall safety status for each time period
- Allows switching between dates when data spans multiple days

Implementation details:
```jsx
const WindDataTable = ({ windData }: WindDataTableProps) => {
  // Groups data by date
  // For each time period, calculates safety at each height
  // Determines overall safety based on all heights
  // Renders Table component with appropriate indicators
}
```

### SafetyIndicator

Provides an at-a-glance view of current safety conditions:

- Shows overall safety status with prominent visual indicator
- Displays individual safety status for each analysis height
- Uses data from current and near-future time periods
- Updates automatically when underlying data changes

Implementation details:
```jsx
const SafetyIndicator = ({ windData }: SafetyIndicatorProps) => {
  // Filters for current and near-future data
  // Calculates safety status for each height
  // Determines overall safety status
  // Renders Card with visual safety indicators
}
```

## Supporting UI Components

### LocationInput

Allows users to input custom coordinates:

- Provides fields for latitude and longitude input
- Validates input to ensure coordinates are valid
- Updates parent component when new coordinates are submitted
- Displays current location information

### ErrorDisplay

Shows error messages when data fetching fails:

- Displays user-friendly error message
- Provides a retry button to attempt data fetch again
- Avoids technical details in user-facing messages

### LoadingSpinner

Indicates when data is being loaded:

- Shows during initial data load and refreshes
- Provides visual feedback to users during network operations

## UI Design Principles

### Responsive Layout

The application uses a responsive design approach:

- Mobile-first design using Tailwind CSS
- Grid layout that adjusts based on screen size
- Readable text and accessible controls on all devices

### Visual Hierarchy

Information is organized based on importance:

- Safety status is prominently displayed
- Chart and table views are easily accessible through tabs
- Settings and secondary information are placed in less prominent areas

### Color Coding

Colors are used consistently to convey meaning:

- Green indicates safe conditions
- Red indicates unsafe conditions
- Blue/purple used for UI elements and non-safety indicators
- Reference lines in charts use consistent colors

### Error States

The application handles errors gracefully:

- Clear error messages
- Options to retry failed operations
- Fallback to last known good data when possible

### Tabs Interface

The application uses tabs to organize different data views:

```jsx
<Tabs defaultValue="chart">
  <TabsList>
    <TabsTrigger value="chart">Chart View</TabsTrigger>
    <TabsTrigger value="table">Table View</TabsTrigger>
  </TabsList>
  <TabsContent value="chart" className="mt-4">
    <WindSpeedChart windData={windData} showMph={showMph} />
  </TabsContent>
  <TabsContent value="table" className="mt-4">
    <WindDataTable windData={windData} />
  </TabsContent>
</Tabs>
```

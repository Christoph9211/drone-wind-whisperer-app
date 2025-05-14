
# Drone Wind Analysis Application

## Core Functionality

### Wind Data Analysis
- Fetches real-time wind data from the National Weather Service API
- Analyzes wind conditions at multiple altitudes (10m, 20m, 50m, 80m, 100m, 120m)
- Assesses safety for drone operations based on predefined thresholds
- Displays both raw and processed data in visual formats

### Safety Assessment
- Implements safety thresholds: MAX_SAFE_WIND=11.0 m/s, MAX_SAFE_GUST=12.0 m/s
- Calculates wind speeds at different heights using the power law profile
- Provides clear visual indicators (✅/❌) for safe/unsafe conditions
- Shows overall safety status based on all analyzed heights

### Data Visualization
- Interactive charts showing wind speeds at different altitudes
- Tabular views with hourly wind data and safety indicators
- Toggle between m/s and mph units
- Safety threshold reference lines on charts

### User Interface
- Clean, responsive design with modern UI components
- Tab-based navigation between chart and table views
- Location input for custom coordinates
- Loading states and error handling with fallback to mock data

## Technical Implementation

### API Integration
- Uses fetch API to connect with National Weather Service
- Two-step process: first gets grid points, then fetches hourly forecast
- Parses and transforms wind data into consistent format
- Implements error handling for API failures

### Data Processing
- Converts between mph and m/s units
- Estimates wind speeds at different altitudes using power law
- Filters for daylight hours (6am-8pm)
- Groups data by date for multi-day analysis

### Reactive UI Components
- Built with React and functional components
- Uses hooks for state management (useState, useEffect)
- Implements automatic refresh every 30 minutes
- Responsive layout adapting to different screen sizes

### Error Handling
- Gracefully handles API failures
- Provides user feedback through toast messages
- Falls back to mock data when API is unavailable
- Allows manual refresh

## Key Components

### Main Components
- DroneWindAnalysis: Main page with overall layout and data fetching logic
- WindSpeedChart: Visualizes wind data with interactive line charts
- WindDataTable: Displays detailed wind data in tabular format
- SafetyIndicator: Shows current safety status for different heights

### Utility Modules
- weatherApi.ts: API communication and data transformation
- windCalculations.ts: Wind-related calculations and safety checks
- constants.ts: Application-wide configuration values

### UI Elements
- LocationInput: Allows users to input custom coordinates
- ErrorDisplay: Shows error messages with retry option
- LoadingSpinner: Indicates data loading state

## Default Settings

### Location Configuration
- Default location: LAT=38.01, LON=-92.17
- Timezone: America/Chicago

### Analysis Parameters
- Heights analyzed: 10m, 20m, 50m, 80m, 100m, and 120m
- Safety thresholds: 11.0 m/s for steady winds, 12.0 m/s for gusts
- Wind model: Power Law with α=1/7 (typical for open terrain)

### Time Settings
- Daylight hours: 6am-8pm
- Data refresh: Every 30 minutes

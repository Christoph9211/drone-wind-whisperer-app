
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { Sunset } from "lucide-react";
import WindSpeedChart from '@/components/WindSpeedChart';
import WindDataTable from '@/components/WindDataTable';
import LocationInput from '@/components/LocationInput';
import SafetyIndicator from '@/components/SafetyIndicator';
import ErrorDisplay from '@/components/ErrorDisplay';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  fetchNWSForecast, 
  filterDaylightHours, 
  generateMockWindData, 
  WindData,
  calculateSunset 
} from '@/utils/weatherApi';
import { DEFAULT_LOCATION } from '@/utils/constants';

const DroneWindAnalysis = () => {
  const [windData, setWindData] = useState<WindData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [location, setLocation] = useState({
    latitude: DEFAULT_LOCATION.latitude,
    longitude: DEFAULT_LOCATION.longitude
  });
  const [showMph, setShowMph] = useState(false);
  const [sunsetTime, setSunsetTime] = useState<Date | null>(null);
  
  // Calculate sunset time
  useEffect(() => {
    const today = new Date();
    const sunset = calculateSunset(today, location.latitude, location.longitude);
    setSunsetTime(sunset);
  }, [location]);
  
  // Fetch wind data
  const fetchWindData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNWSForecast(location.latitude, location.longitude);
      const filteredData = filterDaylightHours(data, location.latitude, location.longitude);
      setWindData(filteredData);
      toast.success("Wind data fetched successfully!");
    } catch (err) {
      console.error("Error fetching wind data:", err);
      setError(err as Error);
      toast.error("Failed to fetch wind data. Using mock data instead.");
      // Use mock data as fallback
      const mockData = generateMockWindData(location.latitude, location.longitude);
      const filteredMockData = filterDaylightHours(mockData, location.latitude, location.longitude);
      setWindData(filteredMockData);
    } finally {
      setLoading(false);
    }
  };

  // Handle location change
  const handleLocationChange = (lat: number, lon: number) => {
    setLocation({ latitude: lat, longitude: lon });
  };
  
  // Fetch data on mount and when location changes
  useEffect(() => {
    fetchWindData();
    
    // Set up automatic refresh interval (every 30 minutes)
    const refreshInterval = setInterval(() => {
      fetchWindData();
    }, 30 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [location]);
  
  const dayNames = [...new Set(windData.map(data => 
    data.timestamp.toLocaleDateString(undefined, { weekday: 'long' })
  ))];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Drone Wind Analysis
            </h1>
            <Badge variant="outline" className="ml-2">
              LAT: {location.latitude.toFixed(2)}, LON: {location.longitude.toFixed(2)}
            </Badge>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {error && (
            <ErrorDisplay error={error} onRetry={fetchWindData} />
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              {loading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <SafetyIndicator windData={windData} />
                  
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">
                        Wind Analysis {dayNames.length > 0 ? `for ${dayNames.join(' & ')}` : ''}
                      </h2>
                      <div className="flex items-center">
                        <button
                          onClick={() => setShowMph(!showMph)}
                          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md"
                        >
                          Show in: {showMph ? 'm/s' : 'mph'}
                        </button>
                      </div>
                    </div>
                    
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
                  </div>
                </>
              )}
            </div>
            
            <div className="space-y-6">
              <LocationInput onLocationChange={handleLocationChange} />
              
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-medium mb-2">Safety Thresholds</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Max Safe Wind:</span>
                    <span className="font-medium">11.0 m/s (24.6 mph)</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Max Safe Gust:</span>
                    <span className="font-medium">12.0 m/s (26.8 mph)</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-medium mb-2">Analysis Settings</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Analysis Heights:</span>
                    <span className="font-medium">10m, 20m, 50m, 80m, 100m, 120m</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Wind Model:</span>
                    <span className="font-medium">Power Law (α=1/7)</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Data Source:</span>
                    <span className="font-medium">NWS API</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>Today's Sunset:</span>
                    <span className="font-medium flex items-center">
                      <Sunset className="h-4 w-4 mr-1 text-amber-500" />
                      {sunsetTime ? sunsetTime.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : 'Calculating...'}
                    </span>
                  </li>
                </ul>
              </div>
              
              <button 
                onClick={fetchWindData}
                className="w-full bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white mt-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            Drone Wind Analysis Tool • Data from National Weather Service API
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DroneWindAnalysis;

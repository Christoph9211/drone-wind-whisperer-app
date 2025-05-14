
import { useState, useEffect, useCallback} from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import WindSpeedChart from '@/components/WindSpeedChart';
import WindDataTable from '@/components/WindDataTable';
import LocationInput from '@/components/LocationInput';
import SafetyIndicator from '@/components/SafetyIndicator';
import ErrorDisplay from '@/components/ErrorDisplay';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchNWSForecast, filterDaylightHours, WindData, generateMockWindData } from '@/utils/weatherApi';
import { DEFAULT_LOCATION } from '@/utils/constants';
import { useStationData } from '@/hooks/useStationData';

const DroneWindAnalysis = () => {
  const [windData, setWindData] = useState<WindData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [location, setLocation] = useState({
    latitude: DEFAULT_LOCATION.latitude,
    longitude: DEFAULT_LOCATION.longitude
  });
  const [showMph, setShowMph] = useState(false);
  const [useEstimation, setUseEstimation] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  
  // Wrap fetchWindData in useCallback
  const fetchWindData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: WindData[];
      
      if (useMockData) {
        data = generateMockWindData();
        toast({
          title: "Using mock data",
          description: "Real API data is not being used."
        });
      } else {
        data = await fetchNWSForecast(location.latitude, location.longitude);
        
      }
      
      const filteredData = filterDaylightHours(data);
      setWindData(filteredData);
    } catch (err) {
      console.error("Error fetching wind data:", err);
      setError(err as Error);
      
      
      if (useMockData || confirm("Would you like to use mock data instead?")) {
        const mockData = generateMockWindData();
        const filteredMockData = filterDaylightHours(mockData);
        setWindData(filteredMockData);
        setUseMockData(true);
        toast({
          title: "Using mock data",
          description: "Real API data is not available."
        });
      }
    } finally {
      setLoading(false);
    }
  }, [location, useMockData]); // Include dependencies used inside the callback
  
  // Now useEffect can safely include fetchWindData as a dependency
  useEffect(() => {
    fetchWindData();
    
    // Set up automatic refresh interval (every 30 minutes)
    const refreshInterval = setInterval(() => {
      fetchWindData();
    }, 30 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchWindData]); // fetchWindData already depends on location and useMockData

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
  }, [location, useMockData, fetchWindData]);
  
  // Use the station data hook to enhance our wind data with gusts
  const { 
    enhancedData, 
    loading: stationLoading, 
    nearestStation 
  } = useStationData({
    latitude: location.latitude,
    longitude: location.longitude,
    forecastData: windData,
    enabled: !useMockData,
    useEstimation
  });
  
  const dayNames = [...new Set(enhancedData.map(data => 
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
                  <SafetyIndicator windData={enhancedData} />
                  
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">
                        Wind Analysis {dayNames.length > 0 ? `for ${dayNames.join(' & ')}` : ''}
                      </h2>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setShowMph(!showMph)}
                          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md"
                        >
                          Show in: {showMph ? 'm/s' : 'mph'}
                        </button>
                        
                        {nearestStation && (
                          <Badge variant="secondary">
                            Data source: {nearestStation.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Tabs defaultValue="chart">
                      <TabsList>
                        <TabsTrigger value="chart">Chart View</TabsTrigger>
                        <TabsTrigger value="table">Table View</TabsTrigger>
                      </TabsList>
                      <TabsContent value="chart" className="mt-4">
                        <WindSpeedChart windData={enhancedData} showMph={showMph} />
                      </TabsContent>
                      <TabsContent value="table" className="mt-4">
                        <WindDataTable windData={enhancedData} />
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
                <h3 className="text-lg font-medium mb-2">Data Source</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="mock-data" 
                      checked={useMockData} 
                      onCheckedChange={setUseMockData}
                    />
                    <Label htmlFor="mock-data">Use Mock Data</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="gust-estimation" 
                      checked={useEstimation} 
                      disabled={useMockData}
                      onCheckedChange={setUseEstimation}
                    />
                    <Label htmlFor="gust-estimation">
                      Gust Estimation
                      <span className="block text-xs text-gray-500">
                        When observation data is unavailable
                      </span>
                    </Label>
                  </div>
                </div>
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
                    <span className="font-medium">
                      {useMockData ? 'Mock Data' : nearestStation ? `NWS API + ${nearestStation.name}` : 'NWS API'}
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

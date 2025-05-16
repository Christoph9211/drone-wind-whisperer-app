
import { useState, useEffect, useCallback } from 'react';
import { toast } from "@/hooks/use-toast";
import { 
  fetchNWSForecast, 
  filterDaylightHours, 
  WindData, 
  generateMockWindData 
} from '@/utils/weatherApi';
import { DEFAULT_LOCATION } from '@/utils/constants';

interface UseWindDataProps {
  initialUseMockData?: boolean;
}

export const useWindData = ({ initialUseMockData = false }: UseWindDataProps = {}) => {
  const [windData, setWindData] = useState<WindData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [location, setLocation] = useState({
    latitude: DEFAULT_LOCATION.latitude,
    longitude: DEFAULT_LOCATION.longitude
  });
  const [useMockData, setUseMockData] = useState(initialUseMockData);
  
  // Fetch wind data
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
    } finally {
      setLoading(false);
    }
  }, [location, useMockData]);
  
  // Set up automatic refresh
  useEffect(() => {
    fetchWindData();
    
    // Set up automatic refresh interval (every 30 minutes)
    const refreshInterval = setInterval(() => {
      fetchWindData();
    }, 30 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchWindData]);
  
  // Handle location change
  const handleLocationChange = (lat: number, lon: number) => {
    setLocation({ latitude: lat, longitude: lon });
  };
  
  // Handle fallback to mock data
  const handleFallbackToMockData = () => {
    setUseMockData(true);
    const mockData = generateMockWindData();
    const filteredMockData = filterDaylightHours(mockData);
    setWindData(filteredMockData);
  };
  
  return {
    windData,
    loading,
    error,
    location,
    useMockData,
    setUseMockData,
    fetchWindData,
    handleLocationChange,
    handleFallbackToMockData
  };
};

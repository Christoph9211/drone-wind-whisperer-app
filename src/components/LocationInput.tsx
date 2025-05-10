
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, MapPin, AlertCircle } from "lucide-react";
import { DEFAULT_LOCATION } from '@/utils/constants';
import { geocodeAddress } from '@/utils/geocodingService';

interface LocationInputProps {
  onLocationChange: (lat: number, lon: number) => void;
}

const LocationInput = ({ onLocationChange }: LocationInputProps) => {
  // State for coordinates input
  const [latitude, setLatitude] = useState(DEFAULT_LOCATION.latitude.toString());
  const [longitude, setLongitude] = useState(DEFAULT_LOCATION.longitude.toString());
  
  // State for address input
  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [matchedLocation, setMatchedLocation] = useState<string | null>(null);
  
  // Submit coordinates directly
  const handleCoordinatesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    if (!isNaN(lat) && !isNaN(lon)) {
      onLocationChange(lat, lon);
      setMatchedLocation(null);
      setSearchError(null);
    }
  };
  
  // Geocode address and submit resulting coordinates
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.trim()) {
      setSearchError('Please enter an address or zipcode');
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const result = await geocodeAddress(address);
      setLatitude(result.latitude.toString());
      setLongitude(result.longitude.toString());
      setMatchedLocation(result.displayName);
      onLocationChange(result.latitude, result.longitude);
    } catch (error) {
      setSearchError((error as Error).message);
      console.error('Geocoding failed:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-medium">Location Settings</h3>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="coordinates" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="coordinates" className="flex-1">
              <MapPin className="w-4 h-4 mr-2" />
              Coordinates
            </TabsTrigger>
            <TabsTrigger value="address" className="flex-1">
              <Search className="w-4 h-4 mr-2" />
              Address/Zipcode
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="coordinates">
            <form onSubmit={handleCoordinatesSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium mb-1">
                    Latitude
                  </label>
                  <Input
                    id="latitude"
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g. 38.01"
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium mb-1">
                    Longitude
                  </label>
                  <Input
                    id="longitude"
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g. -92.17"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">Update Location</Button>
            </form>
          </TabsContent>
          
          <TabsContent value="address">
            <form onSubmit={handleAddressSubmit} className="space-y-4 mt-2">
              <div>
                <label htmlFor="address" className="block text-sm font-medium mb-1">
                  Address or Zipcode
                </label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter address or zipcode"
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isSearching}>
                    {isSearching ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {searchError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{searchError}</AlertDescription>
                </Alert>
              )}
              
              {matchedLocation && (
                <div className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium">Location found:</span> {matchedLocation}
                </div>
              )}
              
              {!searchError && !isSearching && (
                <div className="text-xs text-gray-500 mt-1">
                  <p>Enter a full address, city and state, or zipcode</p>
                </div>
              )}
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        Default location: LAT=38.01, LON=-92.17 (America/Chicago)
      </CardFooter>
    </Card>
  );
};

export default LocationInput;

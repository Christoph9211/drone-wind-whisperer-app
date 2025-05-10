
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { DEFAULT_LOCATION } from '@/utils/constants';

interface LocationInputProps {
  onLocationChange: (lat: number, lon: number) => void;
}

const LocationInput = ({ onLocationChange }: LocationInputProps) => {
  const [latitude, setLatitude] = useState(DEFAULT_LOCATION.latitude.toString());
  const [longitude, setLongitude] = useState(DEFAULT_LOCATION.longitude.toString());
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    
    if (!isNaN(lat) && !isNaN(lon)) {
      onLocationChange(lat, lon);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-medium">Location Settings</h3>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        Default location: LAT=38.01, LON=-92.17 (America/Chicago)
      </CardFooter>
    </Card>
  );
};

export default LocationInput;

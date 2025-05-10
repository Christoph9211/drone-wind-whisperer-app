
/**
 * Geocoding service to convert addresses and zip codes to coordinates
 * Using Nominatim/OpenStreetMap (free, no API key required)
 */

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
  address?: {
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

/**
 * Convert an address or zipcode to latitude and longitude coordinates
 * @param query Address or zipcode string
 * @returns Promise with lat/lon coordinates
 */
export const geocodeAddress = async (query: string): Promise<{ latitude: number; longitude: number; displayName: string }> => {
  try {
    // Format query for URL
    const formattedQuery = encodeURIComponent(query);
    
    // Call Nominatim API (OpenStreetMap)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${formattedQuery}&limit=1`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DroneWindAnalysis/1.0' // Nominatim requires a user agent
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as NominatimResponse[];
    
    if (!data || data.length === 0) {
      throw new Error('No results found for this address');
    }
    
    const result = data[0];
    
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name
    };
    
  } catch (error) {
    console.error('Error in geocoding address:', error);
    throw error;
  }
};

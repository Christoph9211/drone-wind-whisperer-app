
import { WindData } from '@/utils/weatherApi';
import { estimateWindAtHeight } from '@/utils/windCalculations';

declare global {
  interface Window {
    google: {
      charts?: {
        load: (version: string, settings: { packages: string[] }) => void
        setOnLoadCallback: (callback: () => void) => void
      }
      visualization?: Record<string, unknown>
    }
  }
}

export const loadGoogleChartsLibrary = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.charts) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google) {
        window.google.charts.load('current', {
          packages: ['corechart', 'line']
        });
        window.google.charts.setOnLoadCallback(() => {
          resolve();
        });
      }
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Charts library'));
    };
    
    document.head.appendChild(script);
  });
};

export const transformWindDataForChart = (
  windData: WindData[], 
  showMph: boolean, 
  showGusts: boolean
) => {
  const conversionFactor = showMph ? 1 / 0.44704 : 1;

  return windData.map(data => {
    const baseSpeed = data.windSpeed;
    const speed20m = estimateWindAtHeight(baseSpeed, 10, 20);
    const speed50m = estimateWindAtHeight(baseSpeed, 10, 50);
    const speed80m = estimateWindAtHeight(baseSpeed, 10, 80);
    const speed100m = estimateWindAtHeight(baseSpeed, 10, 100);
    const speed120m = estimateWindAtHeight(baseSpeed, 10, 120);
    
    const time = data.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const row = [
      time,
      baseSpeed * conversionFactor,
      speed20m * conversionFactor,
      speed50m * conversionFactor,
      speed80m * conversionFactor,
      speed100m * conversionFactor,
      speed120m * conversionFactor,
    ];
    
    if (showGusts && data.windGust !== undefined) {
      row.push(data.windGust * conversionFactor);
    } else if (showGusts) {
      row.push(null);
    }
    
    return row;
  });
};

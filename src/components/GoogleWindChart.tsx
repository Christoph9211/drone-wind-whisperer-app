
import { useState, useEffect, useRef, useCallback } from 'react';
import { WindData } from '@/utils/weatherApi';
import LoadingSpinner from './LoadingSpinner';
import GoogleChartControls from './GoogleChartControls';
import { loadGoogleChartsLibrary, transformWindDataForChart } from '@/utils/googleChartsUtils';
import { createChartOptions, createDataTable } from './GoogleChartOptions';

interface GoogleWindChartProps {
  windData: WindData[];
  showMph?: boolean;
}

const GoogleWindChart = ({ windData, showMph = false }: GoogleWindChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [showGusts, setShowGusts] = useState(true);
  const [isLibLoaded, setIsLibLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [chartId] = useState(`wind-chart-${Math.random().toString(36).substr(2, 9)}`);

  // Load Google Charts library
  useEffect(() => {
    const initializeGoogleCharts = async () => {
      try {
        await loadGoogleChartsLibrary();
        setIsLibLoaded(true);
      } catch (err) {
        setError(err as Error);
      }
    };

    if (!window.google) {
      initializeGoogleCharts();
    } else if (window.google.charts) {
      setIsLibLoaded(true);
    }
  }, []);

  // Set chart container ID
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.id = chartId;
    }
  }, [chartId]);

  const drawChart = useCallback(() => {
    const google = window.google;
    if (!google || !google.visualization) return;

    const transformedData = transformWindDataForChart(windData, showMph, showGusts);
    const dataTable = createDataTable(transformedData, showGusts);
    const options = createChartOptions(showMph, showGusts);
    
    if (!dataTable) return;

    const chart = new google.visualization.LineChart(document.getElementById(chartId));
    chart.draw(dataTable, options);
    
    google.visualization.events.addListener(chart, 'ready', () => {
      // Chart is ready
    });
  }, [windData, showMph, showGusts, chartId]);

  useEffect(() => {
    if (!isLibLoaded || !chartRef.current || !windData.length) return;

    try {
      drawChart();
    } catch (err) {
      console.error("Error drawing chart:", err);
      setError(err as Error);
    }
  }, [isLibLoaded, windData, drawChart]);

  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="text-red-600 p-4 rounded-md bg-red-50 mb-4">
          Error loading Google Charts: {error.message}
        </div>
      </div>
    );
  }

  if (!isLibLoaded) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md h-[400px] flex items-center justify-center">
        <LoadingSpinner />
        <span className="ml-2">Loading Google Charts...</span>
      </div>
    );
  }

  const hasGustData = windData.some(d => d.windGust !== undefined);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Google Wind Speed Chart</h3>
        <div className="text-sm text-gray-500">
          Interactive features: zoom, pan, tooltips
        </div>
      </div>
      
      <div ref={chartRef} className="h-[400px] w-full" />
      
      <GoogleChartControls 
        showGusts={showGusts}
        onToggleGusts={setShowGusts}
        hasGustData={hasGustData}
      />
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          * Google Charts provides enhanced interactive features such as zooming and panning.
          Try dragging to zoom in on specific time periods.
        </p>
      </div>
    </div>
  );
};

export default GoogleWindChart;

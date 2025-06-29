
interface GoogleChartControlsProps {
  showGusts: boolean;
  onToggleGusts: (show: boolean) => void;
  hasGustData: boolean;
}

const GoogleChartControls = ({ 
  showGusts, 
  onToggleGusts, 
  hasGustData 
}: GoogleChartControlsProps) => {
  if (!hasGustData) return null;

  return (
    <div className="flex items-center mt-2">
      <input
        type="checkbox"
        id="showGoogleGusts"
        checked={showGusts}
        onChange={() => onToggleGusts(!showGusts)}
        className="mr-2"
      />
      <label htmlFor="showGoogleGusts">Show Wind Gusts</label>
    </div>
  );
};

export default GoogleChartControls;

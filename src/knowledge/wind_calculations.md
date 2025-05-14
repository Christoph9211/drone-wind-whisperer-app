
# Wind Calculations

## Wind Speed Calculations

The application implements several key calculations to analyze wind conditions for drone operations. These calculations are primarily defined in the `windCalculations.ts` file.

### Power Law Model

The application uses the power law profile to estimate wind speeds at different altitudes. This is a standard meteorological model that accounts for the increase in wind speed with height due to reduced surface friction.

```typescript
export const estimateWindAtHeight = (
  referenceSpeed: number,
  referenceHeight: number = 10,
  targetHeight: number,
  alpha: number = 1/7
): number => {
  return referenceSpeed * Math.pow(targetHeight / referenceHeight, alpha);
};
```

Where:
- `referenceSpeed` is the measured wind speed at the reference height (usually 10m)
- `referenceHeight` is the height at which the wind speed was measured (typically 10m)
- `targetHeight` is the height for which we want to estimate the wind speed
- `alpha` is the Hellman exponent (1/7 is typical for open terrain)

### Unit Conversions

The application supports both metric (m/s) and imperial (mph) units, with functions to convert between them:

```typescript
export const mphToMs = (mph: number): number => {
  return mph * 0.44704;
};

export const msToMph = (ms: number): number => {
  return ms / 0.44704;
};
```

### Safety Thresholds

The application defines safety thresholds for drone operations:

```typescript
export const MAX_SAFE_WIND = 11.0; // m/s
export const MAX_SAFE_GUST = 12.0; // m/s
```

These thresholds are used to determine if wind conditions are safe for drone operations:

```typescript
export const isSafeForDrones = (windSpeed: number, gustSpeed?: number): boolean => {
  if (windSpeed > MAX_SAFE_WIND) {
    return false;
  }
  
  if (gustSpeed !== undefined && gustSpeed > MAX_SAFE_GUST) {
    return false;
  }
  
  return true;
};
```

### Formatting Functions

For display purposes, the application includes formatting functions for wind speeds:

```typescript
export const formatWindSpeed = (speed: number): string => {
  const mph = msToMph(speed);
  return `${speed.toFixed(1)} m/s (${mph.toFixed(1)} mph)`;
};
```

## Analysis Heights

The application analyzes wind conditions at multiple standard heights:

```typescript
export const ANALYSIS_HEIGHTS = [10, 20, 50, 80, 100, 120]; // in meters
```

These heights are selected to cover the range of typical drone operations, from near-ground operations to maximum permitted altitudes in most jurisdictions.

## Technical Details

### Wind Power Law

The Power Law model is based on the empirical relationship:

$$ u(z) = u_r \left( \frac{z}{z_r} \right)^\alpha $$

Where:
- $u(z)$ is the wind speed at height z
- $u_r$ is the known wind speed at reference height $z_r$
- $\alpha$ is the Hellman exponent (varies with terrain and atmospheric stability)

Typical values for the Hellman exponent ($\alpha$):
- 1/7 (≈ 0.143) for open terrain
- 1/5 (= 0.2) for suburban areas
- 1/3 (≈ 0.333) for urban areas

The application uses 1/7 as the default, which is appropriate for the open terrain where drone operations typically occur.

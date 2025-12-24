// ===============================
// Carbon emission factors (KG CO₂ per unit)
// ===============================

export const TRAVEL_EMISSION_FACTORS: Record<string, number> = {
  car: 0.12,        // 0.12 kg CO₂ / km
  motorbike: 0.09, // 0.09 kg CO₂ / km
  bus: 0.07,       // 0.07 kg CO₂ / km
  train: 0.04,     // 0.04 kg CO₂ / km
  cycle: 0,
  walk: 0,
};

// Electricity emission factor (kg CO₂ per kWh)
export const ELECTRICITY_EMISSION_FACTOR = 0.45;

// Food emission factors (kg CO₂ per meal)
export const FOOD_EMISSION_FACTORS: Record<string, number> = {
  vegan: 0.5,
  veg: 0.8,
  'non-veg': 2.5,
};

// ===============================
// Types
// ===============================

export interface CarbonEntry {
  travelDistanceKm: number;
  travelMode: string;
  electricityKwh: number;
  foodType: string;
}

export interface EmissionBreakdown {
  travel: number;       // kg
  electricity: number; // kg
  food: number;        // kg
  total: number;       // kg
}

// ===============================
// Core calculation (ALL IN KG)
// ===============================

export function calculateEmissions(entry: CarbonEntry): EmissionBreakdown {
  const travel =
    entry.travelDistanceKm *
    (TRAVEL_EMISSION_FACTORS[entry.travelMode] || 0);

  const electricity =
    entry.electricityKwh * ELECTRICITY_EMISSION_FACTOR;

  const food =
    FOOD_EMISSION_FACTORS[entry.foodType] ?? FOOD_EMISSION_FACTORS.veg;

  const total = travel + electricity + food;

  return {
    travel: Number(travel.toFixed(2)),
    electricity: Number(electricity.toFixed(2)),
    food: Number(food.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

// ===============================
// Formatting (UI only)
// ===============================

export function formatEmissions(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(2)}t`;
  }
  if (kg >= 1) {
    return `${kg.toFixed(2)}kg`;
  }
  return `${Math.round(kg * 1000)}g`;
}

// ===============================
// Levels (thresholds in KG)
// ===============================

export function getEmissionLevel(
  totalKg: number
): 'excellent' | 'good' | 'average' | 'high' {
  if (totalKg < 3) return 'excellent';
  if (totalKg < 6) return 'good';
  if (totalKg < 10) return 'average';
  return 'high';
}

export function getEmissionColor(level: string): string {
  switch (level) {
    case 'excellent':
      return 'text-emerald';
    case 'good':
      return 'text-emerald-light';
    case 'average':
      return 'text-amber';
    case 'high':
      return 'text-coral';
    default:
      return 'text-muted-foreground';
  }
}

// ===============================
// Demo / mock data (KG)
// ===============================

export function generateMockWeekData(): Array<{
  date: Date;
  travel: number;
  electricity: number;
  food: number;
  total: number;
  travelMode: string;
  foodType: string;
}> {
  const modes = ['car', 'bus', 'train', 'cycle', 'walk'];
  const foods = ['vegan', 'veg', 'non-veg'];
  const data = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const travelMode = modes[Math.floor(Math.random() * modes.length)];
    const foodType = foods[Math.floor(Math.random() * foods.length)];
    const distance = Math.floor(Math.random() * 40) + 5;
    const electricity = Math.floor(Math.random() * 8) + 2;

    const emissions = calculateEmissions({
      travelDistanceKm: distance,
      travelMode,
      electricityKwh: electricity,
      foodType,
    });

    data.push({
      date,
      ...emissions,
      travelMode,
      foodType,
    });
  }

  return data;
}

// ===============================
// Badges (KG based)
// ===============================

export const BADGES = [
  { id: 'eco_starter', name: 'Eco Starter', icon: '🌿', description: 'Logged your first carbon entry' },
  { id: 'bike_lover', name: 'Bike Lover', icon: '🚴', description: 'Used cycle or walk for 5 days' },
  { id: 'veg_day', name: 'Veg Day', icon: '🍃', description: 'Chose vegetarian meals for 3 days' },
  { id: 'earth_hero', name: 'Earth Hero', icon: '🏆', description: 'Reduced weekly emissions by 20%' },
  { id: 'green_streak', name: 'Green Streak', icon: '🔥', description: '7 day logging streak' },
  { id: 'carbon_cutter', name: 'Carbon Cutter', icon: '✂️', description: 'Under 5kg CO₂ for a day' },
  { id: 'transit_pro', name: 'Transit Pro', icon: '🚌', description: 'Used public transport 10 times' },
  { id: 'solar_saver', name: 'Solar Saver', icon: '☀️', description: 'Electricity usage under 5kWh for a week' },
];

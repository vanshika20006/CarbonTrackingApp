import { supabase } from '@/integrations/supabase/client';
import { BADGES } from './carbonCalculations';
import { format, subDays } from 'date-fns';

interface CarbonEntry {
  travel_mode: string | null;
  food_type: string | null;
  total_emissions: number | null;
  electricity_kwh: number | null;
  entry_date: string;
}

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const newlyEarned: string[] = [];

  // Fetch user's entries
  const { data: entries, error: entriesError } = await supabase
    .from('carbon_entries')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false });

  if (entriesError || !entries) return newlyEarned;

  // Fetch already earned badges
  const { data: existingBadges } = await supabase
    .from('achievements')
    .select('badge_id')
    .eq('user_id', userId);

  const earnedBadgeIds = new Set(existingBadges?.map((b) => b.badge_id) || []);

  // Check each badge condition
  const badgesToAward: string[] = [];

  // 🌿 Eco Starter: Logged first entry
  if (!earnedBadgeIds.has('eco_starter') && entries.length >= 1) {
    badgesToAward.push('eco_starter');
  }

  // 🚴 Bike Lover: Used cycle or walk for 5 days
  const bikeWalkDays = new Set(
    entries.filter((e) => e.travel_mode === 'cycle' || e.travel_mode === 'walk').map((e) => e.entry_date)
  );
  if (!earnedBadgeIds.has('bike_lover') && bikeWalkDays.size >= 5) {
    badgesToAward.push('bike_lover');
  }

  // 🍃 Veg Day: Chose vegetarian/vegan meals for 3 days
  const vegDays = new Set(
    entries.filter((e) => e.food_type === 'veg' || e.food_type === 'vegan').map((e) => e.entry_date)
  );
  if (!earnedBadgeIds.has('veg_day') && vegDays.size >= 3) {
    badgesToAward.push('veg_day');
  }

  // ✂️ Carbon Cutter: Under 5kg CO2 for a day
  const lowCarbonDay = entries.find((e) => (e.total_emissions || 0) < 5000);
  if (!earnedBadgeIds.has('carbon_cutter') && lowCarbonDay) {
    badgesToAward.push('carbon_cutter');
  }

  // 🔥 Green Streak: 7 day logging streak
  const uniqueDates = [...new Set(entries.map((e) => e.entry_date))].sort().reverse();
  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const curr = new Date(uniqueDates[i - 1]);
    const prev = new Date(uniqueDates[i]);
    const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
      if (streak >= 7) break;
    } else {
      streak = 1;
    }
  }
  if (!earnedBadgeIds.has('green_streak') && streak >= 7) {
    badgesToAward.push('green_streak');
  }

  // 🚌 Transit Pro: Used public transport 10 times
  const transitCount = entries.filter((e) => e.travel_mode === 'bus' || e.travel_mode === 'train').length;
  if (!earnedBadgeIds.has('transit_pro') && transitCount >= 10) {
    badgesToAward.push('transit_pro');
  }

  // ☀️ Solar Saver: Electricity usage under 5kWh for a week (7 entries)
  const lowElecDays = entries.filter((e) => (e.electricity_kwh || 0) < 5);
  if (!earnedBadgeIds.has('solar_saver') && lowElecDays.length >= 7) {
    badgesToAward.push('solar_saver');
  }

  // Award new badges
  for (const badgeId of badgesToAward) {
    const { error } = await supabase.from('achievements').insert({
      user_id: userId,
      badge_id: badgeId,
    });
    if (!error) {
      newlyEarned.push(badgeId);
    }
  }

  return newlyEarned;
}

export function getBadgeById(badgeId: string) {
  return BADGES.find((b) => b.id === badgeId);
}

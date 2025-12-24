import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DistanceRequest {
  origin: string;
  destination: string;
  mode?: string;
}

// Convert address to coordinates using ORS geocoding
async function geocode(address: string, apiKey: string): Promise<{ lat: number; lng: number }> {
  const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(address)}&size=1`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.features || data.features.length === 0) {
    throw new Error(`Could not geocode address: ${address}`);
  }
  
  const [lng, lat] = data.features[0].geometry.coordinates;
  return { lat, lng };
}

// Map travel modes to ORS profiles
function getORSProfile(mode: string): string {
  switch (mode) {
    case "car":
    case "motorbike":
      return "driving-car";
    case "cycle":
      return "cycling-regular";
    case "walk":
      return "foot-walking";
    case "bus":
    case "train":
      return "driving-car"; // ORS doesn't have public transit, use car as approximation
    default:
      return "driving-car";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ORS_API_KEY");
    if (!apiKey) {
      throw new Error("OpenRouteService API key not configured");
    }

    const { origin, destination, mode = "driving" }: DistanceRequest = await req.json();

    if (!origin || !destination) {
      throw new Error("Origin and destination are required");
    }

    console.log(`Calculating distance from "${origin}" to "${destination}" via ${mode}`);

    // Check if origin/destination are coordinates (lat,lng format)
    const coordRegex = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
    
    let originCoords: { lat: number; lng: number };
    let destCoords: { lat: number; lng: number };

    if (coordRegex.test(origin.trim())) {
      const [lat, lng] = origin.split(",").map(Number);
      originCoords = { lat, lng };
    } else {
      originCoords = await geocode(origin, apiKey);
    }

    if (coordRegex.test(destination.trim())) {
      const [lat, lng] = destination.split(",").map(Number);
      destCoords = { lat, lng };
    } else {
      destCoords = await geocode(destination, apiKey);
    }

    console.log(`Origin coords: ${originCoords.lat}, ${originCoords.lng}`);
    console.log(`Destination coords: ${destCoords.lat}, ${destCoords.lng}`);

    const profile = getORSProfile(mode);
    
    // Call ORS directions API
    const directionsUrl = `https://api.openrouteservice.org/v2/directions/${profile}`;
    const directionsResponse = await fetch(directionsUrl, {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: [
          [originCoords.lng, originCoords.lat],
          [destCoords.lng, destCoords.lat]
        ],
      }),
    });

    const directionsData = await directionsResponse.json();
    console.log("ORS Response:", JSON.stringify(directionsData));

    if (directionsData.error) {
      throw new Error(directionsData.error.message || "OpenRouteService API error");
    }

    if (!directionsData.routes || directionsData.routes.length === 0) {
      throw new Error("Could not calculate route for the given locations");
    }

    const route = directionsData.routes[0];
    const distanceMeters = route.summary.distance;
    const durationSeconds = route.summary.duration;

    const distanceKm = distanceMeters / 1000;
    const durationMinutes = Math.round(durationSeconds / 60);

    // Format distance text
    const distanceText = distanceKm >= 1 
      ? `${distanceKm.toFixed(1)} km` 
      : `${Math.round(distanceMeters)} m`;

    // Format duration text
    let durationText: string;
    if (durationMinutes >= 60) {
      const hours = Math.floor(durationMinutes / 60);
      const mins = durationMinutes % 60;
      durationText = mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
    } else {
      durationText = `${durationMinutes} min`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        distance: {
          km: distanceKm,
          text: distanceText,
        },
        duration: {
          minutes: durationMinutes,
          text: durationText,
        },
        origin: origin,
        destination: destination,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error calculating distance:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

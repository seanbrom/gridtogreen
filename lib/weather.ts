import { fetchWithRetry } from "./fetch-utils";
import type { WeatherForecast } from "@/types";

interface OpenMeteoResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    windspeed_10m: number[];
  };
}

export async function fetchRaceDayForecast(
  lat: number,
  lng: number,
  raceDate: string
): Promise<WeatherForecast> {
  const dateStr = raceDate.split("T")[0];

  const data = await fetchWithRetry<OpenMeteoResponse>(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation_probability,windspeed_10m&start_date=${dateStr}&end_date=${dateStr}`
  );

  const temps = data.hourly.temperature_2m;
  const precip = data.hourly.precipitation_probability;
  const wind = data.hourly.windspeed_10m;

  // Focus on afternoon hours (12:00-18:00) when races typically happen
  const afternoonStart = 12;
  const afternoonEnd = 18;
  const afternoonTemps = temps.slice(afternoonStart, afternoonEnd + 1);
  const afternoonPrecip = precip.slice(afternoonStart, afternoonEnd + 1);
  const afternoonWind = wind.slice(afternoonStart, afternoonEnd + 1);

  const maxTemp = Math.max(...(afternoonTemps.length > 0 ? afternoonTemps : temps));
  const maxPrecip = Math.max(...(afternoonPrecip.length > 0 ? afternoonPrecip : precip));
  const avgWind =
    (afternoonWind.length > 0 ? afternoonWind : wind).reduce((s, v) => s + v, 0) /
    (afternoonWind.length > 0 ? afternoonWind : wind).length;

  let conditionSummary: string;
  if (maxPrecip > 70) {
    conditionSummary = "High rain probability — wet race likely";
  } else if (maxPrecip > 40) {
    conditionSummary = "Moderate rain risk — mixed conditions possible";
  } else if (maxPrecip > 15) {
    conditionSummary = "Low rain risk — mostly dry expected";
  } else if (maxTemp > 35) {
    conditionSummary = "Hot and dry — high tire degradation expected";
  } else {
    conditionSummary = "Dry conditions expected";
  }

  return {
    conditionSummary,
    maxTempC: Math.round(maxTemp * 10) / 10,
    precipitationProbability: maxPrecip,
    windSpeedKmh: Math.round(avgWind * 10) / 10,
  };
}

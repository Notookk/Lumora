import type { LumoraSettings, WeatherData } from '../types/lumora';

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    is_day?: number;
  };
}

interface GeocodingResponse {
  results?: Array<{
    name: string;
    country?: string;
    admin1?: string;
    latitude: number;
    longitude: number;
  }>;
}

interface OpenWeatherResponse {
  name?: string;
  main?: { temp?: number };
  weather?: Array<{ id?: number; main?: string; description?: string; icon?: string }>;
}

const conditionForCode = (code: number) => {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorms';
};

const getCoordinates = () =>
  new Promise<GeolocationCoordinates>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      reject,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  });

const fetchJson = async <T,>(url: string, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Weather request failed (${response.status}).`);
  return response.json() as Promise<T>;
};

export const fetchWeather = async (
  settings: LumoraSettings,
  signal?: AbortSignal,
): Promise<WeatherData> => {
  if (settings.weatherApiKey) {
    const query = settings.weatherCity || 'current location';
    let latitude = settings.latitude;
    let longitude = settings.longitude;
    if (!settings.weatherCity && (latitude === undefined || longitude === undefined)) {
      const coordinates = await getCoordinates();
      latitude = coordinates.latitude;
      longitude = coordinates.longitude;
    }
    const url = settings.weatherCity
      ? `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(settings.weatherCity)}&units=metric&appid=${encodeURIComponent(settings.weatherApiKey)}`
      : `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${encodeURIComponent(settings.weatherApiKey)}`;
    const data = await fetchJson<OpenWeatherResponse>(url, signal);
    if (typeof data.main?.temp !== 'number') throw new Error('Weather data is unavailable.');
    const weather = data.weather?.[0];
    return {
      temperature: Math.round(data.main.temp),
      code: weather?.id ?? 0,
      condition: weather?.main ?? 'Unknown',
      isDay: weather?.icon?.endsWith('d') ?? true,
      location: data.name || query,
      latitude,
      longitude,
    };
  }

  let latitude = settings.latitude;
  let longitude = settings.longitude;
  let location = settings.weatherCity;

  if (settings.weatherCity || latitude === undefined || longitude === undefined) {
    if (settings.weatherCity) {
      const geocoding = await fetchJson<GeocodingResponse>(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(settings.weatherCity)}&count=1&language=en&format=json`,
        signal,
      );
      const place = geocoding.results?.[0];
      if (!place) throw new Error('City not found.');
      latitude = place.latitude;
      longitude = place.longitude;
      location = [place.name, place.admin1, place.country].filter(Boolean).join(', ');
    } else {
      const coordinates = await getCoordinates();
      latitude = coordinates.latitude;
      longitude = coordinates.longitude;
      location = 'Current location';
    }
  }

  const data = await fetchJson<OpenMeteoResponse>(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,is_day&timezone=auto`,
    signal,
  );
  const code = data.current?.weather_code ?? 0;
  return {
    temperature: Math.round(data.current?.temperature_2m ?? 0),
    code,
    condition: conditionForCode(code),
    isDay: data.current?.is_day !== 0,
    location: location || 'Current location',
    latitude,
    longitude,
  };
};

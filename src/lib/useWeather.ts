import { useEffect, useState } from 'react';
import { fetchWeather } from './weather';
import { useLumoraStore } from '../store/useLumoraStore';
import type { WeatherData } from '../types/lumora';

export const useWeather = () => {
  const enabled = useLumoraStore((state) => state.settings.weatherEnabled);
  const apiKey = useLumoraStore((state) => state.settings.weatherApiKey);
  const city = useLumoraStore((state) => state.settings.weatherCity);
  const latitude = useLumoraStore((state) => state.settings.latitude);
  const longitude = useLumoraStore((state) => state.settings.longitude);
  const updateSettings = useLumoraStore((state) => state.updateSettings);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (!enabled) {
      setWeather(null);
      return;
    }

    const controller = new AbortController();
    const settings = useLumoraStore.getState().settings;
    void fetchWeather(settings, controller.signal)
      .then((result) => {
        setWeather(result);
        if (!apiKey && !city && settings.latitude === undefined && controller.signal.aborted === false) {
          void updateSettings({ latitude: result.latitude, longitude: result.longitude });
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setWeather(null);
      });

    const interval = window.setInterval(() => {
      void fetchWeather(useLumoraStore.getState().settings, controller.signal)
        .then(setWeather)
        .catch(() => undefined);
    }, 600000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [enabled, apiKey, city, latitude, longitude, updateSettings]);

  return weather;
};

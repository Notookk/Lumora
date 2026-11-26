import { useEffect, useMemo, useState } from 'react';
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  MapPin,
  Moon,
  Sun,
} from 'lucide-react';
import { useLumoraStore } from '../store/useLumoraStore';
import { useWeather } from '../lib/useWeather';
import type { WeatherData } from '../types/lumora';

function WeatherIcon({ weather }: { weather: WeatherData }) {
  const props = { size: 15, strokeWidth: 1.6, 'aria-hidden': true as const };
  if (weather.code >= 95) return <CloudLightning {...props} />;
  if (weather.code >= 71 && weather.code <= 86) return <CloudSnow {...props} />;
  if (weather.code >= 51) return <CloudRain {...props} />;
  if (weather.code >= 45) return <CloudFog {...props} />;
  if (weather.code >= 1) return <Cloud {...props} />;
  return weather.isDay ? <Sun {...props} /> : <Moon {...props} />;
}

export default function HeroDisplay({ onOpenSettings }: { onOpenSettings: () => void }) {
  const settings = useLumoraStore((state) => state.settings);
  const weather = useWeather();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const heroText = useMemo(() => {
    if (settings.heroMode === 'day') {
      return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now).toUpperCase();
    }
    return settings.customHero.trim().toUpperCase() || 'LUMORA';
  }, [settings.heroMode, settings.customHero, now]);

  const time = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: settings.hour12,
  }).format(now);
  const date = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(now);

  return (
    <div className="hero-display" aria-live="polite">
      <div className={`hero-wordmark ${heroText.length > 10 ? 'is-long' : ''}`} aria-label={heroText}>
        {heroText}
      </div>
      <div className="hero-telemetry">
        <time>{time}</time>
        <span className="telemetry-dot" />
        <span>{date}</span>
        {settings.weatherEnabled && weather && (
          <>
            <span className="telemetry-dot" />
            <button type="button" className="weather-pill" onClick={onOpenSettings} title={weather.location}>
              <WeatherIcon weather={weather} />
              <span>{weather.temperature}°</span>
              <span className="weather-condition">{weather.condition}</span>
              <MapPin size={11} strokeWidth={1.6} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

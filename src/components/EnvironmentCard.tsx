import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Globe2, CloudSun, CloudRain, Cloud, Sun, Moon, Thermometer, Wind, Loader2, AlertTriangle } from 'lucide-react';

interface EnvData {
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  temperatureC?: number;
  weatherCode?: number;
  windSpeed?: number;
  fetchedAt?: number;
  source?: 'geolocation' | 'ipapi';
}

const WEATHER_DESCRIPTIONS: Record<number, { label: string; icon: React.ReactNode }> = {
  0: { label: 'Clear sky', icon: <Sun className="w-5 h-5 text-yellow-500" /> },
  1: { label: 'Mainly clear', icon: <Sun className="w-5 h-5 text-yellow-500" /> },
  2: { label: 'Partly cloudy', icon: <CloudSun className="w-5 h-5 text-blue-500" /> },
  3: { label: 'Overcast', icon: <Cloud className="w-5 h-5 text-gray-400" /> },
  45:{ label: 'Fog', icon: <Cloud className="w-5 h-5 text-gray-400" /> },
  48:{ label: 'Depositing rime fog', icon: <Cloud className="w-5 h-5 text-gray-400" /> },
  51:{ label: 'Light drizzle', icon: <CloudRain className="w-5 h-5 text-blue-400" /> },
  53:{ label: 'Moderate drizzle', icon: <CloudRain className="w-5 h-5 text-blue-500" /> },
  55:{ label: 'Dense drizzle', icon: <CloudRain className="w-5 h-5 text-blue-600" /> },
  56:{ label: 'Freezing drizzle', icon: <CloudRain className="w-5 h-5 text-blue-600" /> },
  57:{ label: 'Freezing drizzle', icon: <CloudRain className="w-5 h-5 text-blue-600" /> },
  61:{ label: 'Slight rain', icon: <CloudRain className="w-5 h-5 text-blue-500" /> },
  63:{ label: 'Moderate rain', icon: <CloudRain className="w-5 h-5 text-blue-600" /> },
  65:{ label: 'Heavy rain', icon: <CloudRain className="w-5 h-5 text-blue-700" /> },
  66:{ label: 'Freezing rain', icon: <CloudRain className="w-5 h-5 text-blue-700" /> },
  67:{ label: 'Freezing rain', icon: <CloudRain className="w-5 h-5 text-blue-700" /> },
  71:{ label: 'Slight snow', icon: <Cloud className="w-5 h-5 text-gray-300" /> },
  73:{ label: 'Moderate snow', icon: <Cloud className="w-5 h-5 text-gray-300" /> },
  75:{ label: 'Heavy snow', icon: <Cloud className="w-5 h-5 text-gray-300" /> },
  77:{ label: 'Snow grains', icon: <Cloud className="w-5 h-5 text-gray-300" /> },
  80:{ label: 'Rain showers', icon: <CloudRain className="w-5 h-5 text-blue-600" /> },
  81:{ label: 'Heavy rain showers', icon: <CloudRain className="w-5 h-5 text-blue-700" /> },
  82:{ label: 'Violent rain showers', icon: <CloudRain className="w-5 h-5 text-blue-800" /> },
  85:{ label: 'Snow showers', icon: <Cloud className="w-5 h-5 text-gray-300" /> },
  86:{ label: 'Heavy snow showers', icon: <Cloud className="w-5 h-5 text-gray-300" /> },
  95:{ label: 'Thunderstorm', icon: <CloudRain className="w-5 h-5 text-indigo-600" /> },
  96:{ label: 'Thunderstorm with hail', icon: <CloudRain className="w-5 h-5 text-indigo-700" /> },
  99:{ label: 'Thunderstorm with hail', icon: <CloudRain className="w-5 h-5 text-indigo-800" /> },
};

const CACHE_KEY = 'timepilot-env-cache-v1';
const WEATHER_TTL_MS = 15 * 60 * 1000; // 15 minutes

function cToF(c?: number) {
  if (typeof c !== 'number') return undefined;
  return c * 9 / 5 + 32;
}

async function getPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

const EnvironmentCard: React.FC = () => {
  const [data, setData] = useState<EnvData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localTime, setLocalTime] = useState<string>('');
  const intervalRef = useRef<number | null>(null);

  const tzFromDevice = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  useEffect(() => {
    const cachedRaw = localStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      try {
        const cached: EnvData = JSON.parse(cachedRaw);
        if (cached.fetchedAt && Date.now() - cached.fetchedAt < WEATHER_TTL_MS) {
          setData(cached);
          setLoading(false);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    const fetchEnv = async () => {
      try {
        setLoading(true);
        setError(null);

        let lat: number | undefined;
        let lon: number | undefined;
        let city: string | undefined;
        let region: string | undefined;
        let country: string | undefined;
        let timezone: string | undefined = tzFromDevice;
        let source: EnvData['source'] = 'geolocation';

        try {
          const pos = await getPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } catch (geoErr) {
          // Fallback to IP-based location
          source = 'ipapi';
          const ipRes = await fetch('https://ipapi.co/json/');
          if (!ipRes.ok) throw new Error('IP geolocation failed');
          const ipJson = await ipRes.json();
          lat = typeof ipJson.latitude === 'number' ? ipJson.latitude : parseFloat(ipJson.latitude);
          lon = typeof ipJson.longitude === 'number' ? ipJson.longitude : parseFloat(ipJson.longitude);
          city = ipJson.city;
          region = ipJson.region;
          country = ipJson.country_name || ipJson.country;
          timezone = ipJson.timezone || timezone;
        }

        // Reverse geocode if city/country missing
        if (lat != null && lon != null && (!city || !country)) {
          // 1) Open-Meteo reverse geocoding
          try {
            const revRes = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en`);
            if (revRes.ok) {
              const revJson = await revRes.json();
              const top = revJson && revJson.results && revJson.results[0];
              if (top) {
                city = top.city || top.name || city;
                region = top.admin1 || region;
                country = top.country || country;
                timezone = top.timezone || timezone;
              }
            }
          } catch {}

          // 2) Nominatim fallback if still missing
          if (!city || !country) {
            try {
              const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
              if (nomRes.ok) {
                const nom = await nomRes.json();
                const addr = nom && nom.address ? nom.address : {};
                const disp: string | undefined = nom && nom.display_name;
                city = city || addr.city || addr.town || addr.village || addr.municipality || (disp ? disp.split(',')[0] : undefined);
                region = region || addr.state || addr.region || addr.county;
                country = country || addr.country;
              }
            } catch {}
          }

          // 3) IP-based naming fallback as last resort
          if (!city || !country) {
            try {
              const ipRes2 = await fetch('https://ipapi.co/json/');
              if (ipRes2.ok) {
                const ipJson2 = await ipRes2.json();
                city = city || ipJson2.city;
                region = region || ipJson2.region;
                country = country || ipJson2.country_name || ipJson2.country;
                timezone = ipJson2.timezone || timezone;
              }
            } catch {}
          }
        }

        // Weather
        let temperatureC: number | undefined;
        let weatherCode: number | undefined;
        let windSpeed: number | undefined;
        if (lat != null && lon != null) {
          const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`);
          if (wRes.ok) {
            const wJson = await wRes.json();
            if (wJson && wJson.current_weather) {
              temperatureC = typeof wJson.current_weather.temperature === 'number' ? wJson.current_weather.temperature : undefined;
              weatherCode = wJson.current_weather.weathercode;
              windSpeed = wJson.current_weather.windspeed;
              timezone = wJson.timezone || timezone;
            }
          }
        }

        const payload: EnvData = {
          city,
          region,
          country,
          latitude: lat,
          longitude: lon,
          timezone: timezone || tzFromDevice,
          temperatureC,
          weatherCode,
          windSpeed,
          fetchedAt: Date.now(),
          source,
        };
        setData(payload);
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
        setLoading(false);
      } catch (e: any) {
        setError('Unable to fetch location/weather');
        setLoading(false);
      }
    };

    // Fetch if no data or cached data is incomplete
    const needsRefetch = !data || !data.city || !data.country || typeof data.temperatureC !== 'number';
    if (needsRefetch) fetchEnv();
  }, [data, tzFromDevice]);

  useEffect(() => {
    const updateTime = () => {
      const tz = data?.timezone || tzFromDevice;
      try {
        const now = new Date();
        const fmt = new Intl.DateTimeFormat(undefined, {
          timeZone: tz,
          hour: '2-digit', minute: '2-digit', second: undefined,
          weekday: 'short', month: 'short', day: '2-digit'
        });
        setLocalTime(fmt.format(now));
      } catch {
        setLocalTime(new Date().toLocaleString());
      }
    };
    updateTime();
    intervalRef.current = window.setInterval(updateTime, 60_000);
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [data, tzFromDevice]);

  const weather = useMemo(() => {
    if (!data?.weatherCode) return null;
    return WEATHER_DESCRIPTIONS[data.weatherCode] || null;
  }, [data?.weatherCode]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 dark:bg-gray-900 dark:shadow-gray-900">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white">Your Environment</h2>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>
      {error && (
        <div className="flex items-center text-xs text-red-600 dark:text-red-400 mb-2">
          <AlertTriangle className="w-4 h-4 mr-1" />
          <span>{error}. Showing device timezone.</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Location</div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
              {data?.city ? `${data.city}${data.region ? ', ' + data.region : ''}` : 'Unknown'}{data?.country ? `, ${data.country}` : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <Globe2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Timezone</div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{data?.timezone || tzFromDevice}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Local time: {localTime}</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            {(weather?.icon) || <Sun className="w-5 h-5 text-yellow-500" />}
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Weather</div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-100 flex items-center space-x-2">
              <span>{typeof data?.temperatureC === 'number' ? `${Math.round(data.temperatureC)}°C` : 'N/A'}</span>
              {typeof data?.temperatureC === 'number' && (
                <span className="text-xs text-gray-500 dark:text-gray-400">({Math.round(cToF(data.temperatureC)!) }°F)</span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
              <span>{weather?.label || '—'}</span>
              {typeof data?.windSpeed === 'number' && (
                <span className="inline-flex items-center"><Wind className="w-3 h-3 mr-1" />{Math.round(data.windSpeed)} km/h</span>
              )}
            </div>
          </div>
        </div>
      </div>
      {data?.source && (
        <div className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">Source: {data.source === 'geolocation' ? 'Device location' : 'IP-based'}</div>
      )}
    </div>
  );
};

export default EnvironmentCard;

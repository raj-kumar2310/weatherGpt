/**
 * useWeather hook
 * Fetches current weather + forecast for the current location in the store.
 * Wires results back into the store automatically.
 */

'use client';

import { useEffect, useCallback } from 'react';
import useAppStore from '../store/appStore';
import { fetchCurrentWeather, fetchForecast, normalizeCurrentWeather } from '../lib/weatherApi';
import { evaluateTimeline } from '../lib/riskEngine';

export function useWeather() {
  const location = useAppStore((s) => s.location);
  const setCurrentWeather = useAppStore((s) => s.setCurrentWeather);
  const setForecastBlocks = useAppStore((s) => s.setForecastBlocks);
  const setWeatherLoading = useAppStore((s) => s.setWeatherLoading);
  const setWeatherError = useAppStore((s) => s.setWeatherError);
  const setWeatherCache = useAppStore((s) => s.setWeatherCache);
  const weatherLoading = useAppStore((s) => s.weatherLoading);
  const weatherError = useAppStore((s) => s.weatherError);
  const currentWeather = useAppStore((s) => s.currentWeather);
  const forecastBlocks = useAppStore((s) => s.forecastBlocks);
  const weatherFromCache = useAppStore((s) => s.weatherFromCache);
  const weatherCacheAge = useAppStore((s) => s.weatherCacheAge);

  const load = useCallback(async () => {
    if (!location?.lat || !location?.lon) return;
    setWeatherLoading(true);
    setWeatherError(null);

    try {
      const [currentRes, forecastRes] = await Promise.all([
        fetchCurrentWeather(location.lat, location.lon),
        fetchForecast(location.lat, location.lon),
      ]);

      setCurrentWeather(normalizeCurrentWeather(currentRes.data));
      setForecastBlocks(forecastRes.blocks);
      setWeatherCache(
        currentRes.fromCache || forecastRes.fromCache,
        Math.max(currentRes.cacheAge, forecastRes.cacheAge)
      );
    } catch (err) {
      setWeatherError(err.message || 'Failed to load weather data');
    } finally {
      setWeatherLoading(false);
    }
  }, [location?.lat, location?.lon]);

  useEffect(() => {
    load();
  }, [load]);

  return { loading: weatherLoading, error: weatherError, currentWeather, forecastBlocks, fromCache: weatherFromCache, cacheAge: weatherCacheAge, refresh: load };
}

export function useRiskScore() {
  const forecastBlocks = useAppStore((s) => s.forecastBlocks);
  const selectedActivity = useAppStore((s) => s.selectedActivity);
  const location = useAppStore((s) => s.location);
  const setRiskResult = useAppStore((s) => s.setRiskResult);
  const setIsEvaluating = useAppStore((s) => s.setIsEvaluating);
  const riskResult = useAppStore((s) => s.riskResult);

  const evaluate = useCallback(async () => {
    if (!selectedActivity || !forecastBlocks.length) return;

    setIsEvaluating(true);

    // Simulate processing delay for UX effect
    await new Promise((r) => setTimeout(r, 1800));

    try {
      const terrain = location?.terrain || 'plains';
      const result = evaluateTimeline(forecastBlocks, selectedActivity, terrain);
      setRiskResult(result);
    } finally {
      setIsEvaluating(false);
    }
  }, [forecastBlocks, selectedActivity, location?.terrain]);

  return { riskResult, evaluate };
}

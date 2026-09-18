import { useState, useEffect, useCallback } from 'react';
import {
  getScoutFieldSuggestions,
  saveDynamicScoutSuggestion,
  ScoutFieldSuggestions,
} from '../lib/databaseService';

export function useScoutSuggestions() {
  const [suggestions, setSuggestions] = useState<ScoutFieldSuggestions>({
    gruposScout: [],
    regiones: [],
    fromDatabaseGrupos: [],
    fromDatabaseRegiones: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshSuggestions = useCallback(async (force = false) => {
    try {
      const data = await getScoutFieldSuggestions(force);
      setSuggestions({ ...data });
    } catch (e) {
      console.warn('Error loading scout suggestions:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSuggestions();
  }, [refreshSuggestions]);

  const addCustomSuggestion = useCallback((type: 'grupoScout' | 'region', value: string) => {
    saveDynamicScoutSuggestion(type, value);
    refreshSuggestions(true);
  }, [refreshSuggestions]);

  return {
    gruposScout: suggestions.gruposScout,
    regiones: suggestions.regiones,
    dbGruposSet: new Set(suggestions.fromDatabaseGrupos),
    dbRegionesSet: new Set(suggestions.fromDatabaseRegiones),
    isLoading,
    refreshSuggestions,
    addCustomSuggestion,
  };
}

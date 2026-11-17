// Лавлах өгөгдөл (үе, ангилал, тохиргоо) + хэрэглэгчийн сонгосон "Миний машин"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api.js";

const MetaContext = createContext(null);
const VEHICLE_KEY = "pp_vehicle";

const readVehicle = () => {
  try {
    return JSON.parse(localStorage.getItem(VEHICLE_KEY)) || null;
  } catch {
    return null;
  }
};

export function MetaProvider({ children }) {
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);
  const [vehicle, setVehicleState] = useState(readVehicle);

  const load = useCallback(async () => {
    setError(null);
    try {
      setMeta(await api.get("/meta"));
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // vehicle = { generation: "gen3", label: "Prius 30", vehicleId?, mileageKm? }
  const setVehicle = useCallback((next) => {
    setVehicleState(next);
    try {
      if (next) localStorage.setItem(VEHICLE_KEY, JSON.stringify(next));
      else localStorage.removeItem(VEHICLE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({
    meta,
    error,
    reload: load,
    generations: meta?.generations || [],
    categories: meta?.categories || [],
    settings: meta?.settings || {},
    generationByCode: (code) => meta?.generations.find((g) => g.code === code),
    vehicle,
    setVehicle,
  }), [meta, error, load, vehicle, setVehicle]);

  return <MetaContext.Provider value={value}>{children}</MetaContext.Provider>;
}

export const useMeta = () => useContext(MetaContext);

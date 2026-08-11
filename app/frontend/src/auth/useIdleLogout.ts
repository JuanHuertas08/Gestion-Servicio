import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const IDLE_MINUTES = 10;
const IDLE_MS = IDLE_MINUTES * 60 * 1000;
// No reinicia el temporizador más de una vez cada 5s, para no recalcular en cada pixel de mousemove.
const THROTTLE_MS = 5000;
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

/** Cierra la sesión automáticamente tras IDLE_MINUTES sin actividad del usuario en la pestaña. */
export function useIdleLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastResetRef = useRef(0);

  useEffect(() => {
    const handleIdle = () => {
      logout().finally(() => navigate("/login?motivo=inactividad", { replace: true }));
    };

    const resetTimer = () => {
      const now = Date.now();
      if (now - lastResetRef.current < THROTTLE_MS) return;
      lastResetRef.current = now;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(handleIdle, IDLE_MS);
    };

    resetTimer();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [logout, navigate]);
}

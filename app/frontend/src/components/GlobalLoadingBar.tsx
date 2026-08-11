import { useEffect, useState } from "react";
import { LinearProgress } from "@mui/material";
import { subscribeLoading } from "../api/loadingBus";

/** Barra roja fija en la parte superior, visible mientras haya llamados a la API en curso. */
export function GlobalLoadingBar() {
  const [loading, setLoading] = useState(false);

  useEffect(() => subscribeLoading(setLoading), []);

  if (!loading) return null;

  return (
    <LinearProgress
      color="primary"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: (theme) => theme.zIndex.tooltip + 1,
      }}
    />
  );
}

import { useCallback, useEffect, useState } from "react";
import { Box, Stack, Typography, CircularProgress } from "@mui/material";
import { listSolicitudesServicio } from "../../api/solicitudesServicio";
import type { SolicitudServicio } from "../../api/types";
import { SolicitudPendienteCard } from "./SolicitudPendienteCard";

export function SolicitudesPendientesTab() {
  const [solicitudes, setSolicitudes] = useState<SolicitudServicio[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listSolicitudesServicio({ page: 1, pageSize: 200, estado: "PENDIENTE" });
      setSolicitudes(result.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (solicitudes.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        No hay solicitudes de servicio pendientes de aprobar.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {solicitudes.map((s) => (
        <SolicitudPendienteCard key={s.id} solicitud={s} onAprobada={load} />
      ))}
    </Stack>
  );
}

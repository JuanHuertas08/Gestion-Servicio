import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Chip,
  Typography,
  Paper,
  CircularProgress,
  Box,
} from "@mui/material";
import type { SeguimientoCliente, EstadoSeguimiento } from "../../api/types";
import { listHistorialSeguimiento, type HistorialSeguimientoEntry } from "../../api/proyeccion";
import { formatFecha } from "../../utils/formatDate";

const TIPO_LABEL: Record<string, string> = {
  REPUESTOS: "Repuestos",
  SERVICIO: "Servicio",
  ESTIBADORES: "Estibadores",
};

const ESTADO_LABEL: Record<EstadoSeguimiento, string> = {
  PENDIENTE: "Pendiente",
  REALIZADO: "Realizado",
};

const ESTADO_COLOR: Record<EstadoSeguimiento, "warning" | "success"> = {
  PENDIENTE: "warning",
  REALIZADO: "success",
};

interface Props {
  open: boolean;
  registro: SeguimientoCliente | null;
  onClose: () => void;
}

export function HistorialSeguimientoDialog({ open, registro, onClose }: Props) {
  const [historial, setHistorial] = useState<HistorialSeguimientoEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !registro) return;
    setLoading(true);
    listHistorialSeguimiento(registro.cliente, registro.tipoFacturacion)
      .then(setHistorial)
      .finally(() => setLoading(false));
  }, [open, registro]);

  if (!registro) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Historial de seguimiento
        <Typography variant="body2" color="text.secondary">
          {registro.cliente} · {TIPO_LABEL[registro.tipoFacturacion] ?? registro.tipoFacturacion}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}
        {!loading && historial.length === 0 && (
          <Typography color="text.secondary">Aún no se ha registrado ningún seguimiento.</Typography>
        )}
        {!loading && historial.length > 0 && (
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {historial.map((h) => (
              <Paper key={h.id} variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 0.5 }}>
                  <Chip size="small" label={ESTADO_LABEL[h.estado]} color={ESTADO_COLOR[h.estado]} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatFecha(h.fechaSeguimiento)}
                  </Typography>
                </Stack>
                {h.observaciones && (
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {h.observaciones}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  Registrado por {h.registradoPor ? `${h.registradoPor.nombres} ${h.registradoPor.apellidos}` : "—"}{" "}
                  el {new Date(h.createdAt).toLocaleString("es-CO")}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

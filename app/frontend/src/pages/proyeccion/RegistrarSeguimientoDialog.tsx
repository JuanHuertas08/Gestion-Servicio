import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Stack,
  Alert,
  Typography,
} from "@mui/material";
import type { EstadoSeguimiento, SeguimientoCliente } from "../../api/types";
import { registrarSeguimiento } from "../../api/proyeccion";

const TIPO_LABEL: Record<string, string> = {
  REPUESTOS: "Repuestos",
  SERVICIO: "Servicio",
  ESTIBADORES: "Estibadores",
};

function today(): string {
  // Fecha local del usuario (no UTC): toISOString() puede caer en el día siguiente cuando el
  // huso horario local está detrás de UTC y ya pasó la medianoche UTC pero no la local.
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface Props {
  open: boolean;
  registro: SeguimientoCliente | null;
  onClose: () => void;
  onSaved: () => void;
}

export function RegistrarSeguimientoDialog({ open, registro, onClose, onSaved }: Props) {
  const [estado, setEstado] = useState<EstadoSeguimiento>("REALIZADO");
  const [fecha, setFecha] = useState(today());
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!registro) return null;

  const handleEnter = () => {
    setEstado("REALIZADO");
    setFecha(registro.fechaUltimoSeguimiento ? registro.fechaUltimoSeguimiento.slice(0, 10) : today());
    setObservaciones(registro.observaciones ?? "");
    setError(null);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      await registrarSeguimiento({
        cliente: registro.cliente,
        tipoFacturacion: registro.tipoFacturacion,
        estado,
        fechaSeguimiento: fecha,
        observaciones: observaciones || undefined,
      });
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "No se pudo registrar el seguimiento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ transition: { onEnter: handleEnter } }}
    >
      <DialogTitle>Registrar seguimiento</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>{registro.cliente}</strong> · {TIPO_LABEL[registro.tipoFacturacion] ?? registro.tipoFacturacion}
            {registro.pssr ? ` · ${registro.pssr}` : ""}
          </Typography>
          <TextField
            select
            label="Estado del seguimiento"
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoSeguimiento)}
            fullWidth
          >
            <MenuItem value="PENDIENTE">Pendiente</MenuItem>
            <MenuItem value="REALIZADO">Realizado</MenuItem>
          </TextField>
          <TextField
            label="Fecha del seguimiento"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
            required
          />
          <TextField
            label="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

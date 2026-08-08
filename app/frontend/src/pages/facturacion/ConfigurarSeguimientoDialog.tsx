import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Alert,
  Typography,
} from "@mui/material";
import { listParametrosSeguimiento, updateParametrosSeguimiento } from "../../api/facturacion";

const TIPOS = ["REPUESTOS", "SERVICIO", "ESTIBADORES"] as const;

const TIPO_LABEL: Record<string, string> = {
  REPUESTOS: "Repuestos",
  SERVICIO: "Servicio",
  ESTIBADORES: "Estibadores",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ConfigurarSeguimientoDialog({ open, onClose, onSaved }: Props) {
  const [dias, setDias] = useState<Record<string, string>>({
    REPUESTOS: "",
    SERVICIO: "",
    ESTIBADORES: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoading(true);
    listParametrosSeguimiento()
      .then((parametros) => {
        const next: Record<string, string> = { REPUESTOS: "", SERVICIO: "", ESTIBADORES: "" };
        parametros.forEach((p) => {
          next[p.tipoFacturacion] = String(p.diasSeguimiento);
        });
        setDias(next);
      })
      .catch(() => setError("No se pudo cargar la configuración actual"))
      .finally(() => setLoading(false));
  }, [open]);

  const handleSubmit = async () => {
    setError(null);
    const parsed = TIPOS.map((tipo) => ({
      tipoFacturacion: tipo,
      diasSeguimiento: Number(dias[tipo]),
    }));
    const invalido = parsed.find((p) => !Number.isInteger(p.diasSeguimiento) || p.diasSeguimiento < 0);
    if (invalido) {
      setError(`Ingrese un número de días válido (0 o mayor) para ${TIPO_LABEL[invalido.tipoFacturacion]}`);
      return;
    }
    setSaving(true);
    try {
      await updateParametrosSeguimiento(parsed);
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "No se pudo guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Configurar días de seguimiento</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Días a sumar a la fecha de facturación para proyectar la próxima fecha de seguimiento, según el
          tipo de facturación.
        </Typography>
        <Stack spacing={2}>
          {TIPOS.map((tipo) => (
            <TextField
              key={tipo}
              label={`${TIPO_LABEL[tipo]} (días)`}
              type="number"
              value={dias[tipo]}
              onChange={(e) => setDias((d) => ({ ...d, [tipo]: e.target.value }))}
              disabled={loading}
              slotProps={{ htmlInput: { min: 0, max: 3650 } }}
              fullWidth
            />
          ))}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || loading}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

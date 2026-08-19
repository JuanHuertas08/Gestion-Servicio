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
  Autocomplete,
  Paper,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";
import type { OrdenTrabajoResumen, SolicitudServicio } from "../../api/types";
import { listOrdenesTrabajo } from "../../api/ordenesTrabajo";
import { createSolicitudServicio, updateSolicitudServicio } from "../../api/solicitudesServicio";

interface OrdenOption extends OrdenTrabajoResumen {
  id: string;
}

interface Props {
  open: boolean;
  solicitud: SolicitudServicio | null;
  onClose: () => void;
  onSaved: () => void;
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function maquinaLabel(o: { marca: string | null; modelo: string | null; serialMaquina: string | null }): string {
  const partes = [o.marca, o.modelo].filter(Boolean).join(" ");
  return [partes || null, o.serialMaquina ? `Serial: ${o.serialMaquina}` : null].filter(Boolean).join(" — ") || "-";
}

export function SolicitudServicioFormDialog({ open, solicitud, onClose, onSaved }: Props) {
  const [ordenInputValue, setOrdenInputValue] = useState("");
  const [ordenOptions, setOrdenOptions] = useState<OrdenOption[]>([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenOption | null>(null);
  const [buscandoOrdenes, setBuscandoOrdenes] = useState(false);
  const [fechaSolicitada, setFechaSolicitada] = useState(today());
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isEdit = !!solicitud;

  const handleEnter = () => {
    setError(null);
    setOrdenOptions([]);
    if (solicitud) {
      setOrdenSeleccionada({ id: solicitud.ordenTrabajoId, ...solicitud.ordenTrabajo });
      setOrdenInputValue(`N° ${solicitud.ordenTrabajo.numero} — ${solicitud.ordenTrabajo.cliente}`);
      setFechaSolicitada(solicitud.fechaSolicitada.slice(0, 10));
      setObservaciones(solicitud.observaciones ?? "");
    } else {
      setOrdenSeleccionada(null);
      setOrdenInputValue("");
      setFechaSolicitada(today());
      setObservaciones("");
    }
  };

  useEffect(() => {
    if (!open) return;
    if (ordenSeleccionada && ordenInputValue === `N° ${ordenSeleccionada.numero} — ${ordenSeleccionada.cliente}`) {
      return;
    }
    const timeout = setTimeout(async () => {
      setBuscandoOrdenes(true);
      try {
        const result = await listOrdenesTrabajo({
          page: 1,
          pageSize: 20,
          cliente: ordenInputValue || undefined,
        });
        setOrdenOptions(
          result.data.map((o) => ({
            id: o.id,
            numero: o.numero,
            cliente: o.cliente,
            ciudad: o.ciudad,
            marca: o.marca,
            modelo: o.modelo,
            serialMaquina: o.serialMaquina,
            asesorPssr: o.asesorPssr,
          }))
        );
      } finally {
        setBuscandoOrdenes(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenInputValue, open]);

  const handleSubmit = async () => {
    if (!ordenSeleccionada) {
      setError("Debe seleccionar una orden de trabajo");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const input = {
        ordenTrabajoId: ordenSeleccionada.id,
        fechaSolicitada,
        observaciones: observaciones || undefined,
      };
      if (isEdit && solicitud) {
        await updateSolicitudServicio(solicitud.id, input);
      } else {
        await createSolicitudServicio(input);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "No se pudo guardar la solicitud de servicio");
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
      <DialogTitle>{isEdit ? `Editar solicitud #${solicitud?.numero}` : "Nueva solicitud de servicio"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Autocomplete
            options={ordenOptions}
            value={ordenSeleccionada}
            inputValue={ordenInputValue}
            loading={buscandoOrdenes}
            getOptionLabel={(o) => `N° ${o.numero} — ${o.cliente}`}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            onInputChange={(_e, value) => setOrdenInputValue(value)}
            onChange={(_e, value) => setOrdenSeleccionada(value)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                N° {option.numero} — {option.cliente} {option.ciudad ? `(${option.ciudad})` : ""}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Orden de trabajo"
                required
                placeholder="Busque por cliente..."
                slotProps={{
                  ...params.slotProps,
                  input: {
                    ...params.slotProps.input,
                    endAdornment: (
                      <>
                        {buscandoOrdenes && <CircularProgress size={16} />}
                        {params.slotProps.input.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />

          {ordenSeleccionada && (
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Información de la orden
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">
                <strong>Cliente:</strong> {ordenSeleccionada.cliente}
              </Typography>
              <Typography variant="body2">
                <strong>Ciudad:</strong> {ordenSeleccionada.ciudad ?? "-"}
              </Typography>
              <Typography variant="body2">
                <strong>Máquina:</strong> {maquinaLabel(ordenSeleccionada)}
              </Typography>
              <Typography variant="body2">
                <strong>Asesor:</strong> {ordenSeleccionada.asesorPssr}
              </Typography>
            </Paper>
          )}

          <TextField
            label="Fecha solicitada"
            type="date"
            value={fechaSolicitada}
            onChange={(e) => setFechaSolicitada(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            required
            fullWidth
          />
          <TextField
            label="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            multiline
            minRows={2}
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

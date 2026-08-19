import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Alert,
  Grid,
  Divider,
  Typography,
  Paper,
} from "@mui/material";
import type { Tecnico } from "../../api/types";
import { createTecnico, updateTecnico } from "../../api/tecnicos";

const MESES = [
  { mes: 1, label: "Ene" },
  { mes: 2, label: "Feb" },
  { mes: 3, label: "Mar" },
  { mes: 4, label: "Abr" },
  { mes: 5, label: "May" },
  { mes: 6, label: "Jun" },
  { mes: 7, label: "Jul" },
  { mes: 8, label: "Ago" },
  { mes: 9, label: "Sep" },
  { mes: 10, label: "Oct" },
  { mes: 11, label: "Nov" },
  { mes: 12, label: "Dic" },
];

interface Props {
  open: boolean;
  tecnico: Tecnico | null;
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  nombres: "",
  apellidos: "",
  cargo: "",
  telefono: "",
  correo: "",
};

function capacidadesIniciales(tecnico: Tecnico | null): Record<number, string> {
  const map: Record<number, string> = {};
  MESES.forEach(({ mes }) => {
    const existente = tecnico?.capacidades.find((c) => c.mes === mes);
    map[mes] = existente ? String(existente.capacidadDiaria) : "0";
  });
  return map;
}

export function TecnicoFormDialog({ open, tecnico, onClose, onSaved }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [capacidades, setCapacidades] = useState<Record<number, string>>(capacidadesIniciales(null));
  const [aplicarTodos, setAplicarTodos] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isEdit = !!tecnico;

  const handleEnter = () => {
    setError(null);
    setAplicarTodos("");
    if (tecnico) {
      setForm({
        nombres: tecnico.nombres,
        apellidos: tecnico.apellidos,
        cargo: tecnico.cargo ?? "",
        telefono: tecnico.telefono ?? "",
        correo: tecnico.correo ?? "",
      });
      setCapacidades(capacidadesIniciales(tecnico));
    } else {
      setForm(emptyForm);
      setCapacidades(capacidadesIniciales(null));
    }
  };

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleCapacidadChange = (mes: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCapacidades((c) => ({ ...c, [mes]: e.target.value }));
  };

  const handleAplicarATodos = () => {
    if (aplicarTodos === "") return;
    const nuevo: Record<number, string> = {};
    MESES.forEach(({ mes }) => {
      nuevo[mes] = aplicarTodos;
    });
    setCapacidades(nuevo);
  };

  const handleSubmit = async () => {
    setError(null);
    setSaving(true);
    try {
      const input = {
        nombres: form.nombres,
        apellidos: form.apellidos,
        cargo: form.cargo || undefined,
        telefono: form.telefono || undefined,
        correo: form.correo || undefined,
        capacidades: MESES.map(({ mes }) => ({
          mes,
          capacidadDiaria: Number(capacidades[mes] || 0),
        })),
      };

      if (isEdit && tecnico) {
        await updateTecnico(tecnico.id, input);
      } else {
        await createTecnico(input);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "No se pudo guardar el técnico");
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
      <DialogTitle>{isEdit ? "Editar técnico" : "Nuevo técnico"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Nombres" value={form.nombres} onChange={handleChange("nombres")} required fullWidth />
          <TextField
            label="Apellidos"
            value={form.apellidos}
            onChange={handleChange("apellidos")}
            required
            fullWidth
          />
          <TextField label="Cargo" value={form.cargo} onChange={handleChange("cargo")} fullWidth />
          <TextField label="Teléfono" value={form.telefono} onChange={handleChange("telefono")} fullWidth />
          <TextField
            label="Correo electrónico"
            type="email"
            value={form.correo}
            onChange={handleChange("correo")}
            fullWidth
          />

          <Divider textAlign="left">Capacidad diaria por mes</Divider>
          <Typography variant="caption" color="text.secondary">
            Número de servicios que el técnico puede atender por día, en cada mes del año.
          </Typography>

          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.default" }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5 }}>
              <TextField
                label="Aplicar a los 12 meses"
                type="number"
                size="small"
                value={aplicarTodos}
                onChange={(e) => setAplicarTodos(e.target.value)}
                sx={{ width: 190 }}
                slotProps={{ htmlInput: { min: 0 } }}
              />
              <Button size="small" variant="outlined" onClick={handleAplicarATodos}>
                Aplicar
              </Button>
            </Stack>
            <Grid container spacing={1}>
              {MESES.map(({ mes, label }) => (
                <Grid key={mes} size={{ xs: 4, sm: 2 }}>
                  <TextField
                    label={label}
                    type="number"
                    size="small"
                    value={capacidades[mes]}
                    onChange={handleCapacidadChange(mes)}
                    fullWidth
                    slotProps={{ htmlInput: { min: 0 } }}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>

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

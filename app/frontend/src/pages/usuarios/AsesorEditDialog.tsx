import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack, Alert } from "@mui/material";
import type { AsesorAdmin } from "../../api/asesores";
import { updateAsesor } from "../../api/asesores";

interface Props {
  open: boolean;
  asesor: AsesorAdmin | null;
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = { numeroDocumento: "", correo: "", telefono: "" };

export function AsesorEditDialog({ open, asesor, onClose, onSaved }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (asesor) {
      setForm({
        numeroDocumento: asesor.numeroDocumento ?? "",
        correo: asesor.correo ?? "",
        telefono: asesor.telefono ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [asesor, open]);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!asesor) return;
    setError(null);
    setSaving(true);
    try {
      await updateAsesor(asesor.id, {
        numeroDocumento: form.numeroDocumento || undefined,
        correo: form.correo || undefined,
        telefono: form.telefono || undefined,
      });
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "No se pudo guardar el asesor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar asesor</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Nombre completo (PSSR)" value={asesor?.nombreCompleto ?? ""} fullWidth disabled />
          <TextField
            label="Número de documento"
            value={form.numeroDocumento}
            onChange={handleChange("numeroDocumento")}
            fullWidth
          />
          <TextField label="Correo electrónico" type="email" value={form.correo} onChange={handleChange("correo")} fullWidth />
          <TextField label="Teléfono" value={form.telefono} onChange={handleChange("telefono")} fullWidth />
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

import { useEffect, useState } from "react";
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
} from "@mui/material";
import type { Usuario } from "../../api/types";
import { createUser, updateUser } from "../../api/users";

const ROLES = [
  { value: "ADMINISTRADOR", label: "Administrador" },
  { value: "ASESOR", label: "Asesor" },
  { value: "CONSULTA", label: "Consulta" },
  { value: "TECNICO_SERVICIO", label: "Técnico de Servicio" },
  { value: "SERVICIO_ADMIN", label: "Servicio Admin" },
];

interface Props {
  open: boolean;
  usuario: Usuario | null;
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  nombres: "",
  apellidos: "",
  numeroDocumento: "",
  correo: "",
  telefono: "",
  rol: "CONSULTA",
  password: "",
};

export function UserFormDialog({ open, usuario, onClose, onSaved }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isEdit = !!usuario;

  useEffect(() => {
    if (usuario) {
      setForm({
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        numeroDocumento: usuario.numeroDocumento,
        correo: usuario.correo,
        telefono: usuario.telefono,
        rol: usuario.rol,
        password: "",
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [usuario, open]);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    setError(null);
    setSaving(true);
    try {
      if (isEdit && usuario) {
        await updateUser(usuario.id, {
          nombres: form.nombres,
          apellidos: form.apellidos,
          correo: form.correo,
          telefono: form.telefono,
          rol: form.rol,
          ...(form.password ? { password: form.password } : {}),
        });
      } else {
        await createUser({
          nombres: form.nombres,
          apellidos: form.apellidos,
          numeroDocumento: form.numeroDocumento,
          correo: form.correo,
          telefono: form.telefono,
          rol: form.rol,
          password: form.password,
        });
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "No se pudo guardar el usuario");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
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
          <TextField
            label="Número de documento (usuario)"
            value={form.numeroDocumento}
            onChange={handleChange("numeroDocumento")}
            required
            fullWidth
            disabled={isEdit}
            helperText={isEdit ? "El número de documento no se puede modificar" : "Será el nombre de usuario"}
          />
          <TextField
            label="Correo electrónico"
            type="email"
            value={form.correo}
            onChange={handleChange("correo")}
            required
            fullWidth
          />
          <TextField
            label="Teléfono"
            value={form.telefono}
            onChange={handleChange("telefono")}
            required
            fullWidth
          />
          <TextField select label="Rol" value={form.rol} onChange={handleChange("rol")} required fullWidth>
            {ROLES.map((r) => (
              <MenuItem key={r.value} value={r.value}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            required={!isEdit}
            fullWidth
            helperText="Mínimo 8 caracteres"
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

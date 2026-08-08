import { useState, type FormEvent } from "react";
import { Box, Paper, TextField, Button, Typography, Alert } from "@mui/material";
import { changePassword } from "../api/auth";

export function CambiarPassword() {
  const [actualPassword, setActualPassword] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(false);
    if (nuevaPassword !== confirmar) {
      setError("La confirmación no coincide con la nueva contraseña");
      return;
    }
    try {
      await changePassword(actualPassword, nuevaPassword);
      setOk(true);
      setActualPassword("");
      setNuevaPassword("");
      setConfirmar("");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "No se pudo cambiar la contraseña");
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 420 }}>
      <Typography variant="h6" gutterBottom>
        Cambiar contraseña
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Contraseña actual"
          type="password"
          fullWidth
          margin="normal"
          value={actualPassword}
          onChange={(e) => setActualPassword(e.target.value)}
          required
        />
        <TextField
          label="Nueva contraseña"
          type="password"
          fullWidth
          margin="normal"
          value={nuevaPassword}
          onChange={(e) => setNuevaPassword(e.target.value)}
          required
          helperText="Mínimo 8 caracteres"
        />
        <TextField
          label="Confirmar nueva contraseña"
          type="password"
          fullWidth
          margin="normal"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          required
        />
        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
        {ok && (
          <Alert severity="success" sx={{ mt: 1 }}>
            Contraseña actualizada correctamente
          </Alert>
        )}
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>
          Guardar
        </Button>
      </Box>
    </Paper>
  );
}

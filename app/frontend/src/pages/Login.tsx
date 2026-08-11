import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Paper, TextField, Button, Typography, Alert } from "@mui/material";
import { useAuth } from "../auth/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sesionExpirada = searchParams.get("motivo") === "inactividad";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(numeroDocumento, password);
      navigate("/");
    } catch {
      setError("Documento o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "#1A1A1A",
      }}
    >
      <Paper
        sx={{
          p: 4,
          width: 360,
          borderTop: "4px solid #E4002B",
          borderRadius: 1,
        }}
        elevation={6}
      >
        <Typography variant="h5" gutterBottom sx={{ color: "#1A1A1A" }}>
          Control Servicio
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Ingrese con su número de documento
        </Typography>
        {sesionExpirada && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Su sesión se cerró automáticamente por inactividad.
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Número de documento"
            fullWidth
            margin="normal"
            value={numeroDocumento}
            onChange={(e) => setNumeroDocumento(e.target.value)}
            autoFocus
            required
          />
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }} disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

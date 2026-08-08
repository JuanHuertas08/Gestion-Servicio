import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { Box, Typography, Paper, Stack, Chip, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { listAuditLogs } from "../../api/users";
import type { AuditLogEntry } from "../../api/types";

const ACCION_LABEL: Record<string, string> = {
  CREAR: "Creación",
  EDITAR: "Edición",
  INACTIVAR: "Inactivación",
  REACTIVAR: "Reactivación",
  LOGIN: "Inicio de sesión",
  CAMBIO_PASSWORD: "Cambio de contraseña",
};

const ACCION_COLOR: Record<string, "success" | "info" | "error" | "default" | "warning"> = {
  CREAR: "success",
  EDITAR: "info",
  INACTIVAR: "error",
  REACTIVAR: "success",
  LOGIN: "default",
  CAMBIO_PASSWORD: "warning",
};

export function AuditLogView() {
  const { id } = useParams();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    listAuditLogs(id).then(setLogs);
  }, [id]);

  return (
    <Box>
      <Button component={RouterLink} to="/usuarios" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Volver a usuarios
      </Button>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {id ? "Auditoría del usuario" : "Auditoría general"}
      </Typography>
      <Stack spacing={1.5}>
        {logs.map((log) => (
          <Paper key={log.id} sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 1 }}>
              <Chip
                label={ACCION_LABEL[log.accion] ?? log.accion}
                color={ACCION_COLOR[log.accion] ?? "default"}
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                {new Date(log.createdAt).toLocaleString("es-CO")}
              </Typography>
            </Stack>
            <Typography variant="body2">
              <strong>Realizado por:</strong> {log.actor.nombres} {log.actor.apellidos} (
              {log.actor.numeroDocumento})
            </Typography>
            {log.target && (
              <Typography variant="body2">
                <strong>Sobre:</strong> {log.target.nombres} {log.target.apellidos} (
                {log.target.numeroDocumento})
              </Typography>
            )}
            {!!log.cambios && (
              <Box
                component="pre"
                sx={{
                  mt: 1,
                  p: 1,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  fontSize: 12,
                  overflowX: "auto",
                }}
              >
                {JSON.stringify(log.cambios, null, 2)}
              </Box>
            )}
          </Paper>
        ))}
        {logs.length === 0 && <Typography color="text.secondary">Sin registros de auditoría.</Typography>}
      </Stack>
    </Box>
  );
}

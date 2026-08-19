import { Box, Paper, Typography } from "@mui/material";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";

/** Landing para roles sin módulos asignados todavía (hoy: Técnico de Servicio). */
export function SinAccesoPage() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
      <Paper sx={{ p: 4, maxWidth: 480, textAlign: "center" }} variant="outlined">
        <EngineeringOutlinedIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          Aún no tiene módulos asignados
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Su cuenta es de tipo Técnico de Servicio. Próximamente podrá ingresar aquí a la Agenda de
          Servicio para ver sus servicios programados.
        </Typography>
      </Paper>
    </Box>
  );
}

import { useState } from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import { TecnicosTab } from "./TecnicosTab";
import { SolicitudesServicioTab } from "./SolicitudesServicioTab";
import { ServiciosProgramadosTab } from "./ServiciosProgramadosTab";
import { useAuth } from "../../auth/AuthContext";

interface SubModulo {
  label: string;
  content: React.ReactNode;
}

export function ServicioPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);

  const esSoloServicioAdmin = user?.rol === "SERVICIO_ADMIN";

  const subModulos: SubModulo[] = esSoloServicioAdmin
    ? [{ label: "Servicios programados", content: <ServiciosProgramadosTab /> }]
    : [
        { label: "Administración de técnicos", content: <TecnicosTab /> },
        { label: "Solicitud de servicio", content: <SolicitudesServicioTab /> },
        { label: "Servicios programados", content: <ServiciosProgramadosTab /> },
      ];

  const tabSeguro = Math.min(tab, subModulos.length - 1);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Servicio
      </Typography>
      <Tabs value={tabSeguro} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        {subModulos.map((s) => (
          <Tab key={s.label} label={s.label} />
        ))}
      </Tabs>
      {subModulos[tabSeguro].content}
    </Box>
  );
}

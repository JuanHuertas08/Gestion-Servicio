import { useState } from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import { TecnicosTab } from "./TecnicosTab";
import { SolicitudesServicioTab } from "./SolicitudesServicioTab";

export function ServicioPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Servicio
      </Typography>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Administración de técnicos" />
        <Tab label="Solicitud de servicio" />
      </Tabs>
      {tab === 0 ? <TecnicosTab /> : <SolicitudesServicioTab />}
    </Box>
  );
}

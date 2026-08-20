import { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import { SolicitudesPendientesTab } from "./SolicitudesPendientesTab";
import { CalendarioServiciosTab } from "./CalendarioServiciosTab";

export function ServiciosProgramadosTab() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Pendientes de aprobar" />
        <Tab label="Calendario" />
      </Tabs>
      {tab === 0 ? <SolicitudesPendientesTab /> : <CalendarioServiciosTab />}
    </Box>
  );
}

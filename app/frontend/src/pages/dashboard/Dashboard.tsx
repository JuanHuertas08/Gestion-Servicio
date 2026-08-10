import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Alert,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
} from "@mui/material";
import { getDashboardFiltros, getDashboardKpis } from "../../api/dashboard";
import { listAsesores, type Asesor } from "../../api/asesores";
import type { DashboardKpis } from "../../api/types";
import { VentasCharts } from "./VentasCharts";
import { SeguimientoCharts } from "./SeguimientoCharts";

const currency = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 1 });

const MESES_ABREV = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const toggleButtonSx = {
  textTransform: "none",
  "&.Mui-selected": {
    backgroundColor: "#E4002B",
    color: "#ffffff",
    "&:hover": { backgroundColor: "#c40025" },
  },
};

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Paper sx={{ p: 3, borderTop: "3px solid #E4002B" }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" sx={{ mt: 1, color: "#1A1A1A" }}>
        {value}
      </Typography>
    </Paper>
  );
}

export function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [loading, setLoading] = useState(false);
  const [anios, setAnios] = useState<number[]>([]);
  const [anio, setAnio] = useState<string>("");
  const [mes, setMes] = useState<string>("");
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [asesor, setAsesor] = useState<string>("");

  useEffect(() => {
    getDashboardFiltros().then((f) => setAnios(f.anios));
    listAsesores().then(setAsesores);
  }, []);

  useEffect(() => {
    setLoading(true);
    getDashboardKpis(anio ? Number(anio) : undefined, anio && mes ? Number(mes) : undefined, asesor || undefined)
      .then(setKpis)
      .finally(() => setLoading(false));
  }, [anio, mes, asesor]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Tablero de indicadores
      </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        Indicadores calculados a partir de la facturación cargada y de los seguimientos registrados por los
        asesores.
      </Alert>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 1, alignItems: "center" }}>
            <Typography variant="body2" sx={{ minWidth: 40, color: "text.secondary" }}>
              Año
            </Typography>
            <ToggleButtonGroup
              value={anio}
              exclusive
              size="small"
              onChange={(_e, value) => {
                const nuevoAnio = value ?? "";
                setAnio(nuevoAnio);
                if (!nuevoAnio) setMes("");
              }}
              sx={{ flexWrap: "wrap" }}
            >
              <ToggleButton value="" sx={toggleButtonSx}>
                Todos
              </ToggleButton>
              {anios.map((a) => (
                <ToggleButton key={a} value={String(a)} sx={toggleButtonSx}>
                  {a}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {loading && <CircularProgress size={18} />}
          </Stack>

          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 1, alignItems: "center" }}>
            <Typography variant="body2" sx={{ minWidth: 40, color: "text.secondary" }}>
              Mes
            </Typography>
            <ToggleButtonGroup
              value={mes}
              exclusive
              size="small"
              disabled={!anio}
              onChange={(_e, value) => setMes(value ?? "")}
              sx={{ flexWrap: "wrap" }}
            >
              <ToggleButton value="" sx={toggleButtonSx}>
                Todos
              </ToggleButton>
              {MESES_ABREV.map((nombre, i) => (
                <ToggleButton key={i} value={String(i + 1)} sx={toggleButtonSx}>
                  {nombre}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {!anio && (
              <Typography variant="caption" color="text.secondary">
                Seleccione un año primero
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 1, alignItems: "center" }}>
            <Typography variant="body2" sx={{ minWidth: 40, color: "text.secondary" }}>
              Asesor
            </Typography>
            <ToggleButtonGroup
              value={asesor}
              exclusive
              size="small"
              onChange={(_e, value) => setAsesor(value ?? "")}
              sx={{ flexWrap: "wrap" }}
            >
              <ToggleButton value="" sx={toggleButtonSx}>
                Todos
              </ToggleButton>
              {asesores.map((a) => (
                <ToggleButton key={a.id} value={a.nombreCompleto} sx={toggleButtonSx}>
                  {a.nombreCompleto}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
        </Stack>
      </Paper>

      {kpis && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KpiCard label="Venta neta total" value={currency.format(kpis.ventaNeta)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KpiCard label="Margen bruto" value={currency.format(kpis.margenUsd)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KpiCard label="Margen %" value={percent.format(kpis.margenPct)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KpiCard label="Número de facturas" value={kpis.numFacturas.toLocaleString("es-CO")} />
            </Grid>
          </Grid>

          <VentasCharts anio={anio} mes={mes} asesor={asesor} topAsesores={kpis.topAsesores} />
          <SeguimientoCharts anio={anio} mes={mes} asesor={asesor} />
        </>
      )}
    </Box>
  );
}

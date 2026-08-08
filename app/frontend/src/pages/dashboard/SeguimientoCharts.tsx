import { useEffect, useState } from "react";
import { Box, Typography, Paper, Grid } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { getSeguimientoStats, type SeguimientoStats } from "../../api/dashboard";

const percent = new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 1 });

interface Props {
  anio: string;
  mes: string;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper sx={{ p: 2, borderTop: "3px solid #1A1A1A", height: "100%" }}>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <Paper sx={{ p: 2.5, borderTop: `3px solid ${accent}`, height: "100%" }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" sx={{ mt: 1, color: "#1A1A1A" }}>
        {value}
      </Typography>
    </Paper>
  );
}

export function SeguimientoCharts({ anio, mes }: Props) {
  const [stats, setStats] = useState<SeguimientoStats | null>(null);

  useEffect(() => {
    const a = anio ? Number(anio) : undefined;
    const m = anio && mes ? Number(mes) : undefined;
    getSeguimientoStats(a, m).then(setStats);
  }, [anio, mes]);

  if (!stats) return null;

  const pendientesVigentes = stats.pendientes - stats.vencidos;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Seguimientos de asesores
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="% Cumplimiento" value={percent.format(stats.cumplimientoPct)} accent="#E4002B" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Seguimientos realizados" value={stats.realizados.toLocaleString("es-CO")} accent="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Pendientes" value={stats.pendientes.toLocaleString("es-CO")} accent="#ed6c02" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Vencidos" value={stats.vencidos.toLocaleString("es-CO")} accent="#E4002B" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard title="Estado de los seguimientos">
            {stats.total > 0 ? (
              <PieChart
                series={[
                  {
                    data: [
                      { id: "realizado", value: stats.realizados, label: "Realizado", color: "#2e7d32" },
                      { id: "pendiente", value: pendientesVigentes, label: "Pendiente", color: "#ed6c02" },
                      { id: "vencido", value: stats.vencidos, label: "Vencido", color: "#E4002B" },
                    ],
                    innerRadius: 50,
                    valueFormatter: (v) => `${v.value} (${percent.format(v.value / stats.total)})`,
                  },
                ]}
                height={280}
              />
            ) : (
              <Typography color="text.secondary">Sin datos para el período seleccionado.</Typography>
            )}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <ChartCard title="% Cumplimiento por asesor">
            {stats.porAsesor.length > 0 ? (
              <BarChart
                dataset={stats.porAsesor.map((a) => ({ ...a, cumplimientoPct100: a.cumplimientoPct * 100 }))}
                layout="horizontal"
                yAxis={[{ dataKey: "pssr", scaleType: "band", width: "auto", tickLabelStyle: { fontSize: 11 } }]}
                xAxis={[{ min: 0, max: 100, valueFormatter: (v: number) => `${v}%` }]}
                series={[
                  {
                    dataKey: "cumplimientoPct100",
                    label: "% Cumplimiento",
                    color: "#E4002B",
                    valueFormatter: (v) => `${(v ?? 0).toFixed(1)}%`,
                  },
                ]}
                height={280}
              />
            ) : (
              <Typography color="text.secondary">Sin datos para el período seleccionado.</Typography>
            )}
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
}

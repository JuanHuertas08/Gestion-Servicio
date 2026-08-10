import { useEffect, useState } from "react";
import { Box, Typography, Paper, Grid } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import {
  getVentasPorMarca,
  getVentasPorPeriodo,
  getVentasPorTipo,
  type VentaPorMarca,
  type VentaPorPeriodo,
  type VentaPorTipo,
} from "../../api/dashboard";
import type { DashboardKpis } from "../../api/types";

const currencyCompact = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  notation: "compact",
  maximumFractionDigits: 1,
});
const currency = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const TIPO_LABEL: Record<string, string> = {
  REPUESTOS: "Repuestos",
  SERVICIO: "Servicio",
  ESTIBADORES: "Estibadores",
};

const PIE_COLORS = ["#E4002B", "#1A1A1A", "#6b6b6b", "#c40025", "#9e9e9e", "#3a3a3a"];

interface Props {
  anio: string;
  mes: string;
  asesor: string;
  topAsesores: DashboardKpis["topAsesores"];
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

export function VentasCharts({ anio, mes, asesor, topAsesores }: Props) {
  const [porPeriodo, setPorPeriodo] = useState<VentaPorPeriodo[]>([]);
  const [porTipo, setPorTipo] = useState<VentaPorTipo[]>([]);
  const [porMarca, setPorMarca] = useState<VentaPorMarca[]>([]);

  useEffect(() => {
    getVentasPorPeriodo(anio ? Number(anio) : undefined, asesor || undefined).then(setPorPeriodo);
  }, [anio, asesor]);

  useEffect(() => {
    const a = anio ? Number(anio) : undefined;
    const m = anio && mes ? Number(mes) : undefined;
    getVentasPorTipo(a, m, asesor || undefined).then(setPorTipo);
    getVentasPorMarca(a, m, asesor || undefined).then(setPorMarca);
  }, [anio, mes, asesor]);

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Facturación
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <ChartCard title={anio ? `Venta neta por mes (${anio})` : "Venta neta por año"}>
            {porPeriodo.length > 0 ? (
              <BarChart
                dataset={porPeriodo.map((d) => ({ ...d }))}
                xAxis={[{ dataKey: "periodo", scaleType: "band" }]}
                series={[{ dataKey: "ventaNeta", label: "Venta neta", color: "#E4002B", valueFormatter: (v) => currency.format(v ?? 0) }]}
                yAxis={[{ valueFormatter: (v: number) => currencyCompact.format(v) }]}
                height={280}
                margin={{ left: 80 }}
              />
            ) : (
              <Typography color="text.secondary">Sin datos.</Typography>
            )}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard title="Venta neta por tipo de facturación">
            {porTipo.length > 0 ? (
              <PieChart
                series={[
                  {
                    data: porTipo.map((t, i) => ({
                      id: t.tipo,
                      value: t.ventaNeta,
                      label: TIPO_LABEL[t.tipo] ?? t.tipo,
                      color: PIE_COLORS[i % PIE_COLORS.length],
                    })),
                    innerRadius: 50,
                    valueFormatter: (v) => currency.format(v.value),
                  },
                ]}
                height={260}
              />
            ) : (
              <Typography color="text.secondary">Sin datos.</Typography>
            )}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <ChartCard title="Top asesores por venta neta">
            {topAsesores.length > 0 ? (
              <BarChart
                dataset={topAsesores.map((a) => ({ pssr: a.pssr ?? "(sin asesor)", ventaNeta: a.ventaNeta }))}
                layout="horizontal"
                yAxis={[{ dataKey: "pssr", scaleType: "band", width: "auto", tickLabelStyle: { fontSize: 11 } }]}
                xAxis={[{ valueFormatter: (v: number) => currencyCompact.format(v) }]}
                series={[{ dataKey: "ventaNeta", label: "Venta neta", color: "#E4002B", valueFormatter: (v) => currency.format(v ?? 0) }]}
                height={260}
              />
            ) : (
              <Typography color="text.secondary">Sin datos.</Typography>
            )}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <ChartCard title="Venta neta por marca">
            {porMarca.length > 0 ? (
              <BarChart
                dataset={porMarca.map((d) => ({ ...d }))}
                layout="horizontal"
                yAxis={[{ dataKey: "marca", scaleType: "band", width: "auto", tickLabelStyle: { fontSize: 11 } }]}
                xAxis={[{ valueFormatter: (v: number) => currencyCompact.format(v) }]}
                series={[{ dataKey: "ventaNeta", label: "Venta neta", color: "#1A1A1A", valueFormatter: (v) => currency.format(v ?? 0) }]}
                height={240}
              />
            ) : (
              <Typography color="text.secondary">Sin datos.</Typography>
            )}
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Box, Stack, Typography, IconButton, Button, Paper, Tooltip } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { listSolicitudesServicio } from "../../api/solicitudesServicio";
import type { SolicitudServicio } from "../../api/types";

const MESES_LABEL = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function toUtcDateKey(year: number, monthIndex0: number, day: number): string {
  return new Date(Date.UTC(year, monthIndex0, day)).toISOString().slice(0, 10);
}

function primerDiaDelMes(year: number, monthIndex0: number): Date {
  return new Date(Date.UTC(year, monthIndex0, 1));
}

/** Genera la grilla del mes (semanas de lunes a domingo), incluyendo días del mes anterior/siguiente para completar la primera y última semana. */
function generarGrilla(year: number, monthIndex0: number): { dateKey: string; day: number; enMes: boolean }[][] {
  const primerDia = primerDiaDelMes(year, monthIndex0);
  const diasEnMes = new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
  // getUTCDay(): 0=domingo..6=sábado -> convertir a offset lunes=0..domingo=6
  const offsetInicio = (primerDia.getUTCDay() + 6) % 7;

  const celdas: { dateKey: string; day: number; enMes: boolean }[] = [];
  for (let i = 0; i < offsetInicio; i++) {
    const dia = new Date(primerDia);
    dia.setUTCDate(dia.getUTCDate() - (offsetInicio - i));
    celdas.push({ dateKey: dia.toISOString().slice(0, 10), day: dia.getUTCDate(), enMes: false });
  }
  for (let d = 1; d <= diasEnMes; d++) {
    celdas.push({ dateKey: toUtcDateKey(year, monthIndex0, d), day: d, enMes: true });
  }
  while (celdas.length % 7 !== 0) {
    const ultima = new Date(celdas[celdas.length - 1].dateKey + "T00:00:00Z");
    ultima.setUTCDate(ultima.getUTCDate() + 1);
    celdas.push({ dateKey: ultima.toISOString().slice(0, 10), day: ultima.getUTCDate(), enMes: false });
  }

  const semanas: { dateKey: string; day: number; enMes: boolean }[][] = [];
  for (let i = 0; i < celdas.length; i += 7) {
    semanas.push(celdas.slice(i, i + 7));
  }
  return semanas;
}

function hoyKey(): string {
  const d = new Date();
  return toUtcDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

export function CalendarioServiciosTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex0, setMonthIndex0] = useState(now.getMonth());
  const [solicitudes, setSolicitudes] = useState<SolicitudServicio[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const desde = toUtcDateKey(year, monthIndex0, 1);
      const diasEnMes = new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
      const hasta = toUtcDateKey(year, monthIndex0, diasEnMes);
      const result = await listSolicitudesServicio({
        page: 1,
        pageSize: 200,
        estado: "PROGRAMADA",
        fechaProgramadaDesde: desde,
        fechaProgramadaHasta: hasta,
      });
      setSolicitudes(result.data);
    } finally {
      setLoading(false);
    }
  }, [year, monthIndex0]);

  useEffect(() => {
    load();
  }, [load]);

  const porDia = new Map<string, SolicitudServicio[]>();
  solicitudes.forEach((s) => {
    if (!s.fechaProgramada) return;
    const key = s.fechaProgramada.slice(0, 10);
    const arr = porDia.get(key) ?? [];
    arr.push(s);
    porDia.set(key, arr);
  });
  porDia.forEach((arr) => arr.sort((a, b) => (a.horaProgramada ?? "").localeCompare(b.horaProgramada ?? "")));

  const semanas = generarGrilla(year, monthIndex0);
  const hoy = hoyKey();

  const irMesAnterior = () => {
    if (monthIndex0 === 0) {
      setYear((y) => y - 1);
      setMonthIndex0(11);
    } else {
      setMonthIndex0((m) => m - 1);
    }
  };
  const irMesSiguiente = () => {
    if (monthIndex0 === 11) {
      setYear((y) => y + 1);
      setMonthIndex0(0);
    } else {
      setMonthIndex0((m) => m + 1);
    }
  };
  const irHoy = () => {
    setYear(now.getFullYear());
    setMonthIndex0(now.getMonth());
  };

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "center", gap: 2, mb: 2 }}>
        <IconButton onClick={irMesAnterior} size="small">
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h6" sx={{ minWidth: 220, textAlign: "center" }}>
          {MESES_LABEL[monthIndex0]} {year}
        </Typography>
        <IconButton onClick={irMesSiguiente} size="small">
          <ChevronRightIcon />
        </IconButton>
        <Button size="small" variant="outlined" onClick={irHoy}>
          Mes actual
        </Button>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, opacity: loading ? 0.6 : 1 }}>
        {DIAS_SEMANA.map((d) => (
          <Typography key={d} variant="caption" sx={{ textAlign: "center", fontWeight: 700, color: "text.secondary" }}>
            {d}
          </Typography>
        ))}
        {semanas.flatMap((semana) =>
          semana.map((celda) => {
            const eventos = porDia.get(celda.dateKey) ?? [];
            const esHoy = celda.dateKey === hoy;
            return (
              <Paper
                key={celda.dateKey}
                variant="outlined"
                sx={{
                  minHeight: 96,
                  p: 0.75,
                  opacity: celda.enMes ? 1 : 0.4,
                  borderColor: esHoy ? "primary.main" : undefined,
                  borderWidth: esHoy ? 2 : 1,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: esHoy ? 700 : 400 }}>
                  {celda.day}
                </Typography>
                <Stack spacing={0.3} sx={{ mt: 0.5 }}>
                  {eventos.slice(0, 3).map((s) => (
                    <Tooltip
                      key={s.id}
                      title={`${s.horaProgramada ?? ""} · ${s.ordenTrabajo.cliente} · ${s.tecnico?.nombres ?? ""} ${s.tecnico?.apellidos ?? ""}`}
                    >
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{
                          display: "block",
                          bgcolor: "rgba(228, 0, 43, 0.08)",
                          borderRadius: 0.5,
                          px: 0.5,
                          fontSize: "0.65rem",
                        }}
                      >
                        {s.horaProgramada} {s.ordenTrabajo.cliente}
                      </Typography>
                    </Tooltip>
                  ))}
                  {eventos.length > 3 && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                      +{eventos.length - 3} más
                    </Typography>
                  )}
                </Stack>
              </Paper>
            );
          })
        )}
      </Box>
    </Box>
  );
}

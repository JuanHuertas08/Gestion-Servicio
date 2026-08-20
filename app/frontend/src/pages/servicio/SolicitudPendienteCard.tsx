import { useEffect, useRef, useState } from "react";
import {
  Paper,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Grid,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import type { SolicitudServicio, TecnicoDisponible } from "../../api/types";
import { aprobarSolicitudServicio, getTecnicosDisponibles } from "../../api/solicitudesServicio";
import { formatFecha } from "../../utils/formatDate";

function maquinaLabel(o: { marca: string | null; modelo: string | null; serialMaquina: string | null }): string {
  const partes = [o.marca, o.modelo].filter(Boolean).join(" ");
  return partes || (o.serialMaquina ?? "-");
}

interface Props {
  solicitud: SolicitudServicio;
  onAprobada: () => void;
}

export function SolicitudPendienteCard({ solicitud, onAprobada }: Props) {
  const [fechaProgramada, setFechaProgramada] = useState(solicitud.fechaSolicitada.slice(0, 10));
  const [horaProgramada, setHoraProgramada] = useState("08:00");
  const [tecnicos, setTecnicos] = useState<TecnicoDisponible[]>([]);
  const [tecnicoId, setTecnicoId] = useState("");
  const [cargandoTecnicos, setCargandoTecnicos] = useState(false);
  const [confirmarOpen, setConfirmarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aprobando, setAprobando] = useState(false);
  const autoSeleccionado = useRef(false);

  useEffect(() => {
    let cancelado = false;
    setCargandoTecnicos(true);
    getTecnicosDisponibles(fechaProgramada)
      .then((data) => {
        if (cancelado) return;
        setTecnicos(data);
        if (!autoSeleccionado.current) {
          const primerDisponible = data.find((t) => t.disponible);
          if (primerDisponible) {
            setTecnicoId(primerDisponible.id);
            autoSeleccionado.current = true;
          }
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoTecnicos(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaProgramada]);

  const tecnicoSeleccionado = tecnicos.find((t) => t.id === tecnicoId);

  const handleConfirmar = async () => {
    setError(null);
    setAprobando(true);
    try {
      await aprobarSolicitudServicio(solicitud.id, { tecnicoId, fechaProgramada, horaProgramada });
      setConfirmarOpen(false);
      onAprobada();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "No se pudo aprobar la solicitud");
    } finally {
      setAprobando(false);
    }
  };

  const { ordenTrabajo } = solicitud;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Orden N° {ordenTrabajo.numero} — {ordenTrabajo.cliente}
        </Typography>
        <Chip size="small" label={`Máquina: ${maquinaLabel(ordenTrabajo)}`} />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Ciudad: {ordenTrabajo.ciudad ?? "-"} · Asesor: {ordenTrabajo.asesorPssr} · Fecha de la solicitud:{" "}
        {formatFecha(solicitud.fechaSolicitada)}
      </Typography>

      <Grid container spacing={2} sx={{ alignItems: "center" }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            select
            label="Técnico"
            size="small"
            value={tecnicoId}
            onChange={(e) => setTecnicoId(e.target.value)}
            fullWidth
            disabled={cargandoTecnicos}
          >
            {tecnicos.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.nombreCompleto} {t.disponible ? "" : "(sin capacidad)"}
                {t.capacidadDiaria > 0 ? ` — ${t.asignadosEseDia}/${t.capacidadDiaria}` : ""}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <TextField
            label="Fecha programada"
            type="date"
            size="small"
            value={fechaProgramada}
            onChange={(e) => setFechaProgramada(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 2 }}>
          <TextField
            label="Hora"
            type="time"
            size="small"
            value={horaProgramada}
            onChange={(e) => setHoraProgramada(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<CheckCircleIcon />}
            disabled={!tecnicoId || !fechaProgramada || !horaProgramada}
            onClick={() => setConfirmarOpen(true)}
          >
            Aprobar
          </Button>
        </Grid>
      </Grid>

      <Dialog open={confirmarOpen} onClose={() => setConfirmarOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar aprobación</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            ¿Confirma aprobar el servicio de <strong>{ordenTrabajo.cliente}</strong> (Orden N°{" "}
            {ordenTrabajo.numero}) para el <strong>{formatFecha(fechaProgramada)}</strong> a las{" "}
            <strong>{horaProgramada}</strong>, con el técnico{" "}
            <strong>{tecnicoSeleccionado?.nombreCompleto ?? ""}</strong>?
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmarOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleConfirmar} disabled={aprobando}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

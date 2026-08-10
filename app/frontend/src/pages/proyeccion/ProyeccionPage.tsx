import { useCallback, useEffect, useState } from "react";
import { Box, Typography, Stack, TextField, MenuItem, Chip, Button, Paper, IconButton, Tooltip, Grid } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import EventAvailableIcon from "@mui/icons-material/EventAvailableOutlined";
import HistoryIcon from "@mui/icons-material/HistoryOutlined";
import {
  getResumenSeguimiento,
  listFiltrosSeguimiento,
  listSeguimientos,
  type ResumenSeguimiento,
} from "../../api/proyeccion";
import type { EstadoSeguimiento, FiltrosSeguimiento, SeguimientoCliente } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { RegistrarSeguimientoDialog } from "./RegistrarSeguimientoDialog";
import { HistorialSeguimientoDialog } from "./HistorialSeguimientoDialog";
import { formatFecha } from "../../utils/formatDate";
import { GaugeChart } from "../../components/GaugeChart";

const TIPO_LABEL: Record<string, string> = {
  REPUESTOS: "Repuestos",
  SERVICIO: "Servicio",
  ESTIBADORES: "Estibadores",
};

const ESTADO_LABEL: Record<EstadoSeguimiento, string> = {
  PENDIENTE: "Pendiente",
  REALIZADO: "Realizado",
};

const ESTADO_COLOR: Record<EstadoSeguimiento, "warning" | "success"> = {
  PENDIENTE: "warning",
  REALIZADO: "success",
};

function ResumenCard({ label, value, accent }: { label: string; value: string; accent: string }) {
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

export function ProyeccionPage() {
  const { user } = useAuth();
  const canRegistrar = user?.rol === "ADMINISTRADOR" || user?.rol === "ASESOR";

  const [rows, setRows] = useState<SeguimientoCliente[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(false);

  const [filtros, setFiltros] = useState<FiltrosSeguimiento>({ asesores: [], tiposFacturacion: [] });
  const [asesor, setAsesor] = useState("");
  const [cliente, setCliente] = useState("");
  const [tipoFacturacion, setTipoFacturacion] = useState("");
  const [estado, setEstado] = useState<EstadoSeguimiento | "">("");

  const [resumen, setResumen] = useState<ResumenSeguimiento | null>(null);

  const [dialogRegistro, setDialogRegistro] = useState<SeguimientoCliente | null>(null);
  const [dialogHistorial, setDialogHistorial] = useState<SeguimientoCliente | null>(null);

  useEffect(() => {
    listFiltrosSeguimiento().then(setFiltros);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listSeguimientos({
        page: page + 1,
        pageSize,
        asesor: asesor || undefined,
        cliente: cliente || undefined,
        tipoFacturacion: tipoFacturacion || undefined,
        estado: estado || undefined,
      });
      setRows(result.data);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, asesor, cliente, tipoFacturacion, estado]);

  useEffect(() => {
    load();
  }, [load]);

  // El resumen y el tacómetro describen la distribución por estado, así que no se filtran por
  // estado (eso los dejaría siempre en 0 para uno de los dos lados).
  const loadResumen = useCallback(async () => {
    const result = await getResumenSeguimiento({
      asesor: asesor || undefined,
      cliente: cliente || undefined,
      tipoFacturacion: tipoFacturacion || undefined,
    });
    setResumen(result);
  }, [asesor, cliente, tipoFacturacion]);

  useEffect(() => {
    loadResumen();
  }, [loadResumen]);

  const columns: GridColDef<SeguimientoCliente>[] = [
    { field: "cliente", headerName: "Cliente", flex: 1, minWidth: 220 },
    {
      field: "ultimaFechaFacturacion",
      headerName: "Última fecha de facturación",
      width: 170,
      valueFormatter: (value) => formatFecha(value as string | null),
    },
    {
      field: "tipoFacturacion",
      headerName: "Tipo de facturación",
      width: 150,
      valueFormatter: (value) => TIPO_LABEL[value as string] ?? value,
    },
    { field: "pssr", headerName: "Asesor (PSSR)", flex: 1, minWidth: 180, valueGetter: (_v, row) => row.pssr ?? "-" },
    {
      field: "fechaProximoSeguimiento",
      headerName: "Fecha de próximo seguimiento",
      width: 190,
      valueFormatter: (value) => formatFecha(value as string | null),
    },
    {
      field: "estado",
      headerName: "Estado del seguimiento",
      width: 170,
      renderCell: (params) => (
        <Chip size="small" label={ESTADO_LABEL[params.row.estado]} color={ESTADO_COLOR[params.row.estado]} />
      ),
    },
    {
      field: "acciones",
      headerName: "Acción",
      width: canRegistrar ? 230 : 90,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <Tooltip title="Ver historial de seguimiento">
            <IconButton size="small" onClick={() => setDialogHistorial(params.row)}>
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canRegistrar && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<EventAvailableIcon />}
              onClick={() => setDialogRegistro(params.row)}
            >
              Registrar seguimiento
            </Button>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Proyección de seguimiento a clientes
      </Typography>

      {resumen && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <ResumenCard
              label="Clientes asignados"
              value={resumen.clientesAsignados.toLocaleString("es-CO")}
              accent="#1A1A1A"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Stack spacing={2} sx={{ height: "100%" }}>
              <ResumenCard
                label="Seguimientos proyectados"
                value={resumen.seguimientosProyectados.toLocaleString("es-CO")}
                accent="#1A1A1A"
              />
              <ResumenCard
                label="Realizados"
                value={resumen.realizados.toLocaleString("es-CO")}
                accent="#2e7d32"
              />
              <ResumenCard
                label="Pendientes"
                value={resumen.pendientes.toLocaleString("es-CO")}
                accent="#ed6c02"
              />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, height: "100%", borderTop: "3px solid #1A1A1A" }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700, textAlign: "center" }}>
                % Cumplimiento de seguimientos
              </Typography>
              <GaugeChart value={resumen.cumplimientoPct * 100} size={280} />
            </Paper>
          </Grid>
        </Grid>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 2 }}>
          <TextField
            select
            label="Asesor"
            size="small"
            value={asesor}
            onChange={(e) => {
              setPage(0);
              setAsesor(e.target.value);
            }}
            sx={{ minWidth: 240 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {filtros.asesores.map((a) => (
              <MenuItem key={a} value={a}>
                {a}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Cliente"
            size="small"
            value={cliente}
            onChange={(e) => {
              setPage(0);
              setCliente(e.target.value);
            }}
            sx={{ minWidth: 240 }}
          />
          <TextField
            select
            label="Tipo de facturación"
            size="small"
            value={tipoFacturacion}
            onChange={(e) => {
              setPage(0);
              setTipoFacturacion(e.target.value);
            }}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {filtros.tiposFacturacion.map((t) => (
              <MenuItem key={t} value={t}>
                {TIPO_LABEL[t] ?? t}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Estado del seguimiento"
            size="small"
            value={estado}
            onChange={(e) => {
              setPage(0);
              setEstado(e.target.value as EstadoSeguimiento | "");
            }}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {(Object.keys(ESTADO_LABEL) as EstadoSeguimiento[]).map((e) => (
              <MenuItem key={e} value={e}>
                {ESTADO_LABEL[e]}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      <Box sx={{ height: 600, bgcolor: "background.paper" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => `${row.cliente}::${row.tipoFacturacion}`}
          loading={loading}
          rowCount={total}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
        />
      </Box>

      <RegistrarSeguimientoDialog
        open={!!dialogRegistro}
        registro={dialogRegistro}
        onClose={() => setDialogRegistro(null)}
        onSaved={() => {
          setDialogRegistro(null);
          load();
          loadResumen();
        }}
      />

      <HistorialSeguimientoDialog
        open={!!dialogHistorial}
        registro={dialogHistorial}
        onClose={() => setDialogHistorial(null)}
      />
    </Box>
  );
}

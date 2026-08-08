import { useCallback, useEffect, useState } from "react";
import { Box, Typography, Stack, TextField, MenuItem, Chip, Button, Paper, IconButton, Tooltip } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import EventAvailableIcon from "@mui/icons-material/EventAvailableOutlined";
import HistoryIcon from "@mui/icons-material/HistoryOutlined";
import { listFiltrosSeguimiento, listSeguimientos } from "../../api/proyeccion";
import type { EstadoSeguimiento, FiltrosSeguimiento, SeguimientoCliente } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { RegistrarSeguimientoDialog } from "./RegistrarSeguimientoDialog";
import { HistorialSeguimientoDialog } from "./HistorialSeguimientoDialog";
import { formatFecha } from "../../utils/formatDate";

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
      });
      setRows(result.data);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, asesor, cliente, tipoFacturacion]);

  useEffect(() => {
    load();
  }, [load]);

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

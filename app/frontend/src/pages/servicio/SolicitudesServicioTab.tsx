import { useEffect, useState, useCallback } from "react";
import { Box, Button, TextField, MenuItem, Stack, Chip, IconButton, Tooltip } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import CancelIcon from "@mui/icons-material/CancelOutlined";
import { listSolicitudesServicio, cancelarSolicitudServicio } from "../../api/solicitudesServicio";
import type { EstadoSolicitudServicio, SolicitudServicio } from "../../api/types";
import { SolicitudServicioFormDialog } from "./SolicitudServicioFormDialog";
import { formatFecha } from "../../utils/formatDate";

const ESTADO_LABEL: Record<EstadoSolicitudServicio, string> = {
  PENDIENTE: "Pendiente",
  PROGRAMADA: "Programada",
  CANCELADA: "Cancelada",
};

const ESTADO_COLOR: Record<EstadoSolicitudServicio, "warning" | "info" | "error"> = {
  PENDIENTE: "warning",
  PROGRAMADA: "info",
  CANCELADA: "error",
};

function maquinaLabel(o: { marca: string | null; modelo: string | null; serialMaquina: string | null }): string {
  const partes = [o.marca, o.modelo].filter(Boolean).join(" ");
  return partes || (o.serialMaquina ?? "-");
}

export function SolicitudesServicioTab() {
  const [rows, setRows] = useState<SolicitudServicio[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(false);

  const [cliente, setCliente] = useState("");
  const [estado, setEstado] = useState<EstadoSolicitudServicio | "">("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SolicitudServicio | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listSolicitudesServicio({
        page: page + 1,
        pageSize,
        cliente: cliente || undefined,
        estado: estado || undefined,
      });
      setRows(result.data);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, cliente, estado]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancelar = async (s: SolicitudServicio) => {
    await cancelarSolicitudServicio(s.id);
    load();
  };

  const columns: GridColDef<SolicitudServicio>[] = [
    { field: "numero", headerName: "No.", width: 80 },
    {
      field: "ordenTrabajoNumero",
      headerName: "Orden de trabajo",
      width: 130,
      valueGetter: (_v, row) => `N° ${row.ordenTrabajo.numero}`,
    },
    { field: "cliente", headerName: "Cliente", flex: 1, minWidth: 200, valueGetter: (_v, row) => row.ordenTrabajo.cliente },
    { field: "ciudad", headerName: "Ciudad", width: 130, valueGetter: (_v, row) => row.ordenTrabajo.ciudad ?? "-" },
    { field: "maquina", headerName: "Máquina", width: 160, valueGetter: (_v, row) => maquinaLabel(row.ordenTrabajo) },
    {
      field: "fechaSolicitada",
      headerName: "Fecha solicitada",
      width: 140,
      valueFormatter: (value) => formatFecha(value as string | null),
    },
    {
      field: "estado",
      headerName: "Estado",
      width: 130,
      renderCell: (params) => (
        <Chip size="small" label={ESTADO_LABEL[params.row.estado]} color={ESTADO_COLOR[params.row.estado]} />
      ),
    },
    {
      field: "acciones",
      headerName: "Acciones",
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Editar">
            <IconButton
              size="small"
              onClick={() => {
                setEditing(params.row);
                setDialogOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cancelar solicitud">
            <span>
              <IconButton
                size="small"
                disabled={params.row.estado === "CANCELADA"}
                onClick={() => handleCancelar(params.row)}
              >
                <CancelIcon fontSize="small" color="error" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Nueva solicitud de servicio
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap", rowGap: 2 }}>
        <TextField
          label="Cliente"
          size="small"
          value={cliente}
          onChange={(e) => {
            setPage(0);
            setCliente(e.target.value);
          }}
          sx={{ minWidth: 220 }}
        />
        <TextField
          select
          label="Estado"
          size="small"
          value={estado}
          onChange={(e) => {
            setPage(0);
            setEstado(e.target.value as EstadoSolicitudServicio | "");
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {(Object.keys(ESTADO_LABEL) as EstadoSolicitudServicio[]).map((e) => (
            <MenuItem key={e} value={e}>
              {ESTADO_LABEL[e]}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Box sx={{ height: 560, bgcolor: "background.paper" }}>
        <DataGrid
          rows={rows}
          columns={columns}
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

      <SolicitudServicioFormDialog
        open={dialogOpen}
        solicitud={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false);
          load();
        }}
      />
    </Box>
  );
}

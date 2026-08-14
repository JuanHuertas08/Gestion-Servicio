import { useEffect, useState, useCallback } from "react";
import { Box, Typography, Button, TextField, MenuItem, Stack, Chip, IconButton, Tooltip } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import CancelIcon from "@mui/icons-material/CancelOutlined";
import { listOrdenesTrabajo, cancelarOrdenTrabajo } from "../../api/ordenesTrabajo";
import { listAsesores, type Asesor } from "../../api/asesores";
import type {
  EstadoOrdenTrabajo,
  OrdenTrabajo,
  PrioridadOrdenTrabajo,
  TipoServicioOrdenTrabajo,
} from "../../api/types";
import { OrdenTrabajoFormDialog } from "./OrdenTrabajoFormDialog";
import { formatFecha } from "../../utils/formatDate";

const TIPO_SERVICIO_LABEL: Record<TipoServicioOrdenTrabajo, string> = {
  PREVENTIVO: "Preventivo",
  CORRECTIVO: "Correctivo",
  PREVENTIVO_CORRECTIVO: "Preventivo y Correctivo",
  DIAGNOSTICO: "Diagnóstico",
  CORTESIA: "Cortesía",
  GARANTIA: "Garantía",
  ENTREGA: "Entrega",
};

const ESTADO_LABEL: Record<EstadoOrdenTrabajo, string> = {
  RADICADO: "Radicado",
  PROGRAMADO: "Programado",
  EN_PROCESO: "En proceso",
  CERRADO: "Cerrado",
  CANCELADO: "Cancelado",
};

const ESTADO_COLOR: Record<EstadoOrdenTrabajo, "default" | "info" | "warning" | "success" | "error"> = {
  RADICADO: "default",
  PROGRAMADO: "info",
  EN_PROCESO: "warning",
  CERRADO: "success",
  CANCELADO: "error",
};

const PRIORIDAD_LABEL: Record<PrioridadOrdenTrabajo, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

const PRIORIDAD_COLOR: Record<PrioridadOrdenTrabajo, "error" | "warning" | "default"> = {
  ALTA: "error",
  MEDIA: "warning",
  BAJA: "default",
};

export function OrdenesTrabajoList() {
  const [rows, setRows] = useState<OrdenTrabajo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(false);

  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [cliente, setCliente] = useState("");
  const [asesorPssr, setAsesorPssr] = useState("");
  const [estado, setEstado] = useState<EstadoOrdenTrabajo | "">("");
  const [prioridad, setPrioridad] = useState<PrioridadOrdenTrabajo | "">("");
  const [ciudad, setCiudad] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OrdenTrabajo | null>(null);

  useEffect(() => {
    listAsesores().then(setAsesores);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listOrdenesTrabajo({
        page: page + 1,
        pageSize,
        cliente: cliente || undefined,
        asesorPssr: asesorPssr || undefined,
        estado: estado || undefined,
        prioridad: prioridad || undefined,
        ciudad: ciudad || undefined,
      });
      setRows(result.data);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, cliente, asesorPssr, estado, prioridad, ciudad]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancelar = async (orden: OrdenTrabajo) => {
    await cancelarOrdenTrabajo(orden.id);
    load();
  };

  const columns: GridColDef<OrdenTrabajo>[] = [
    { field: "numero", headerName: "No.", width: 80 },
    {
      field: "fechaSolicitud",
      headerName: "Fecha solicitud",
      width: 130,
      valueFormatter: (value) => formatFecha(value as string | null),
    },
    { field: "cliente", headerName: "Cliente", flex: 1, minWidth: 200 },
    { field: "asesorPssr", headerName: "Asesor", flex: 1, minWidth: 180 },
    {
      field: "tipoServicio",
      headerName: "Tipo de servicio",
      width: 160,
      valueFormatter: (value) => TIPO_SERVICIO_LABEL[value as TipoServicioOrdenTrabajo] ?? value,
    },
    { field: "ciudad", headerName: "Ciudad", width: 130, valueGetter: (_v, row) => row.ciudad ?? "-" },
    {
      field: "prioridad",
      headerName: "Prioridad",
      width: 110,
      renderCell: (params) => (
        <Chip size="small" label={PRIORIDAD_LABEL[params.row.prioridad]} color={PRIORIDAD_COLOR[params.row.prioridad]} />
      ),
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
      field: "tecnicoAsignado",
      headerName: "Técnico asignado",
      flex: 1,
      minWidth: 160,
      valueGetter: (_v, row) => row.tecnicoAsignado ?? "-",
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
          <Tooltip title="Cancelar orden">
            <span>
              <IconButton
                size="small"
                disabled={params.row.estado === "CANCELADO"}
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
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">Órdenes de trabajo</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Nueva orden de trabajo
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
          label="Asesor"
          size="small"
          value={asesorPssr}
          onChange={(e) => {
            setPage(0);
            setAsesorPssr(e.target.value);
          }}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {asesores.map((a) => (
            <MenuItem key={a.id} value={a.nombreCompleto}>
              {a.nombreCompleto}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Estado"
          size="small"
          value={estado}
          onChange={(e) => {
            setPage(0);
            setEstado(e.target.value as EstadoOrdenTrabajo | "");
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {(Object.keys(ESTADO_LABEL) as EstadoOrdenTrabajo[]).map((e) => (
            <MenuItem key={e} value={e}>
              {ESTADO_LABEL[e]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Prioridad"
          size="small"
          value={prioridad}
          onChange={(e) => {
            setPage(0);
            setPrioridad(e.target.value as PrioridadOrdenTrabajo | "");
          }}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">Todas</MenuItem>
          {(Object.keys(PRIORIDAD_LABEL) as PrioridadOrdenTrabajo[]).map((p) => (
            <MenuItem key={p} value={p}>
              {PRIORIDAD_LABEL[p]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Ciudad"
          size="small"
          value={ciudad}
          onChange={(e) => {
            setPage(0);
            setCiudad(e.target.value);
          }}
          sx={{ minWidth: 160 }}
        />
      </Stack>

      <Box sx={{ height: 600, bgcolor: "background.paper" }}>
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

      <OrdenTrabajoFormDialog
        open={dialogOpen}
        orden={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false);
          load();
        }}
      />
    </Box>
  );
}

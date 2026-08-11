import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import BlockIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import HistoryIcon from "@mui/icons-material/HistoryOutlined";
import { useNavigate } from "react-router-dom";
import { listUsers, setUserActivo } from "../../api/users";
import type { Usuario } from "../../api/types";
import { UserFormDialog } from "./UserFormDialog";
import { AsesoresAdminList } from "./AsesoresAdminList";
import { useAuth } from "../../auth/AuthContext";

const ROLE_LABEL: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  ASESOR: "Asesor",
  CONSULTA: "Consulta",
};

export function UsersList() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Administración de usuarios
      </Typography>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Usuarios" />
        <Tab label="Asesores (PSSR)" />
      </Tabs>
      {tab === 0 ? <UsuariosTab /> : <AsesoresAdminList />}
    </Box>
  );
}

function UsuariosTab() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Usuario[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [busqueda, setBusqueda] = useState("");
  const [rolFiltro, setRolFiltro] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listUsers({
        page: page + 1,
        pageSize,
        busqueda: busqueda || undefined,
        rol: rolFiltro || undefined,
      });
      setRows(result.data);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, busqueda, rolFiltro]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActivo = async (u: Usuario) => {
    await setUserActivo(u.id, !u.activo);
    load();
  };

  const columns: GridColDef<Usuario>[] = [
    { field: "numeroDocumento", headerName: "Documento", width: 130 },
    { field: "nombres", headerName: "Nombres", flex: 1, minWidth: 140 },
    { field: "apellidos", headerName: "Apellidos", flex: 1, minWidth: 140 },
    { field: "correo", headerName: "Correo", flex: 1, minWidth: 180 },
    { field: "telefono", headerName: "Teléfono", width: 130 },
    {
      field: "rol",
      headerName: "Rol",
      width: 140,
      renderCell: (params) => ROLE_LABEL[params.value as string] ?? params.value,
    },
    {
      field: "activo",
      headerName: "Estado",
      width: 110,
      renderCell: (params) =>
        params.value ? (
          <Chip label="Activo" color="success" size="small" />
        ) : (
          <Chip label="Inactivo" color="default" size="small" />
        ),
    },
    {
      field: "acciones",
      headerName: "Acciones",
      width: 140,
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
          <Tooltip title={params.row.activo ? "Inactivar" : "Reactivar"}>
            <span>
              <IconButton
                size="small"
                disabled={params.row.id === currentUser?.id && params.row.activo}
                onClick={() => handleToggleActivo(params.row)}
              >
                {params.row.activo ? (
                  <BlockIcon fontSize="small" color="error" />
                ) : (
                  <CheckCircleIcon fontSize="small" color="success" />
                )}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Ver auditoría">
            <IconButton size="small" onClick={() => navigate(`/usuarios/${params.row.id}/auditoria`)}>
              <HistoryIcon fontSize="small" />
            </IconButton>
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
          Nuevo usuario
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Buscar (nombre, documento, correo)"
          size="small"
          value={busqueda}
          onChange={(e) => {
            setPage(0);
            setBusqueda(e.target.value);
          }}
          sx={{ minWidth: 300 }}
        />
        <TextField
          select
          label="Rol"
          size="small"
          value={rolFiltro}
          onChange={(e) => {
            setPage(0);
            setRolFiltro(e.target.value);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {Object.entries(ROLE_LABEL).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
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
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
        />
      </Box>

      <UserFormDialog
        open={dialogOpen}
        usuario={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false);
          load();
        }}
      />
    </Box>
  );
}

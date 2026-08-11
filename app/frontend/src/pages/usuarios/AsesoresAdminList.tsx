import { useEffect, useState, useCallback } from "react";
import { Box, TextField, MenuItem, Stack, Chip, IconButton, Tooltip } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/EditOutlined";
import BlockIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import LinkIcon from "@mui/icons-material/LinkOutlined";
import { listAsesoresAdmin, setAsesorActivo, type AsesorAdmin } from "../../api/asesores";
import { AsesorEditDialog } from "./AsesorEditDialog";

export function AsesoresAdminList() {
  const [rows, setRows] = useState<AsesorAdmin[]>([]);
  const [estado, setEstado] = useState<"" | "ACTIVO" | "INACTIVO">("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<AsesorAdmin | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAsesoresAdmin(estado || undefined);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, [estado]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActivo = async (a: AsesorAdmin) => {
    if (a.userId) return;
    await setAsesorActivo(a.id, !a.activo);
    load();
  };

  const columns: GridColDef<AsesorAdmin>[] = [
    { field: "nombreCompleto", headerName: "Nombre completo (PSSR)", flex: 1, minWidth: 220 },
    { field: "numeroDocumento", headerName: "Documento", width: 130, valueGetter: (_v, row) => row.numeroDocumento ?? "-" },
    { field: "correo", headerName: "Correo", flex: 1, minWidth: 180, valueGetter: (_v, row) => row.correo ?? "-" },
    { field: "telefono", headerName: "Teléfono", width: 130, valueGetter: (_v, row) => row.telefono ?? "-" },
    {
      field: "userId",
      headerName: "Cuenta vinculada",
      width: 140,
      renderCell: (params) =>
        params.value ? (
          <Tooltip title="Tiene una cuenta de usuario vinculada; su estado se gestiona desde Usuarios">
            <LinkIcon fontSize="small" color="action" />
          </Tooltip>
        ) : (
          "-"
        ),
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
      width: 110,
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
          <Tooltip
            title={
              params.row.userId
                ? "Gestione su estado desde Usuarios"
                : params.row.activo
                  ? "Inactivar"
                  : "Reactivar"
            }
          >
            <span>
              <IconButton size="small" disabled={!!params.row.userId} onClick={() => handleToggleActivo(params.row)}>
                {params.row.activo ? (
                  <BlockIcon fontSize="small" color="error" />
                ) : (
                  <CheckCircleIcon fontSize="small" color="success" />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          label="Estado"
          size="small"
          value={estado}
          onChange={(e) => setEstado(e.target.value as "" | "ACTIVO" | "INACTIVO")}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="ACTIVO">Activo</MenuItem>
          <MenuItem value="INACTIVO">Inactivo</MenuItem>
        </TextField>
      </Stack>

      <Box sx={{ height: 560, bgcolor: "background.paper" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 20, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}
          disableRowSelectionOnClick
        />
      </Box>

      <AsesorEditDialog
        open={dialogOpen}
        asesor={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false);
          load();
        }}
      />
    </Box>
  );
}

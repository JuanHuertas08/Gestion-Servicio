import { useEffect, useState, useCallback } from "react";
import { Box, Typography, Button, TextField, MenuItem, Stack, Chip, IconButton, Tooltip } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import BlockIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import LinkIcon from "@mui/icons-material/LinkOutlined";
import { listTecnicos, setTecnicoActivo } from "../../api/tecnicos";
import type { Tecnico } from "../../api/types";
import { TecnicoFormDialog } from "./TecnicoFormDialog";

function capacidadPromedio(tecnico: Tecnico): string {
  if (tecnico.capacidades.length === 0) return "-";
  const suma = tecnico.capacidades.reduce((acc, c) => acc + c.capacidadDiaria, 0);
  const promedio = suma / tecnico.capacidades.length;
  return promedio % 1 === 0 ? String(promedio) : promedio.toFixed(1);
}

export function AlistamientosList() {
  const [rows, setRows] = useState<Tecnico[]>([]);
  const [estado, setEstado] = useState<"" | "ACTIVO" | "INACTIVO">("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Tecnico | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTecnicos(estado || undefined);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, [estado]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActivo = async (t: Tecnico) => {
    if (t.userId) return;
    await setTecnicoActivo(t.id, !t.activo);
    load();
  };

  const columns: GridColDef<Tecnico>[] = [
    {
      field: "nombreCompleto",
      headerName: "Nombre completo",
      flex: 1,
      minWidth: 220,
      valueGetter: (_v, row) => `${row.nombres} ${row.apellidos}`,
    },
    { field: "cargo", headerName: "Cargo", width: 160, valueGetter: (_v, row) => row.cargo ?? "-" },
    { field: "telefono", headerName: "Teléfono", width: 140, valueGetter: (_v, row) => row.telefono ?? "-" },
    { field: "correo", headerName: "Correo", flex: 1, minWidth: 200, valueGetter: (_v, row) => row.correo ?? "-" },
    {
      field: "capacidadPromedio",
      headerName: "Cap. diaria prom.",
      width: 150,
      valueGetter: (_v, row) => capacidadPromedio(row),
    },
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
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">Administración de alistamientos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Nuevo técnico
        </Button>
      </Stack>

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

      <TecnicoFormDialog
        open={dialogOpen}
        tecnico={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false);
          load();
        }}
      />
    </Box>
  );
}

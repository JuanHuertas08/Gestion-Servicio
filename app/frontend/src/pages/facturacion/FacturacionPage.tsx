import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  Paper,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import UploadFileIcon from "@mui/icons-material/UploadFileOutlined";
import TuneIcon from "@mui/icons-material/TuneOutlined";
import { importFacturacion, listFacturas, listImportBatches } from "../../api/facturacion";
import type { Factura, ImportBatch } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { formatFecha } from "../../utils/formatDate";
import { ConfigurarSeguimientoDialog } from "./ConfigurarSeguimientoDialog";

const currency = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const columns: GridColDef<Factura>[] = [
  { field: "factura", headerName: "Factura", width: 130 },
  { field: "pedido", headerName: "Pedido", width: 120 },
  { field: "cliente", headerName: "Cliente", flex: 1, minWidth: 200 },
  { field: "pssr", headerName: "Asesor (PSSR)", flex: 1, minWidth: 180 },
  { field: "centro", headerName: "Centro", width: 90 },
  { field: "marca", headerName: "Marca", width: 130 },
  {
    field: "fechaFacturacion",
    headerName: "Fecha facturación",
    width: 140,
    valueFormatter: (value) => formatFecha(value as string | null),
  },
  {
    field: "ventaNeta",
    headerName: "Venta neta",
    width: 140,
    valueFormatter: (value) => (value ? currency.format(Number(value)) : ""),
  },
  { field: "esquemaServicio", headerName: "Esquema servicio", width: 140 },
  {
    field: "tipoFacturacion",
    headerName: "Tipo de facturación",
    width: 150,
  },
  {
    field: "proximaFechaSeguimiento",
    headerName: "Próxima fecha de seguimiento",
    width: 190,
    valueFormatter: (value) => formatFecha(value as string | null),
  },
];

export function FacturacionPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === "ADMINISTRADOR";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<Factura[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [cliente, setCliente] = useState("");
  const [pssr, setPssr] = useState("");
  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ batch: ImportBatch; headerErrors: string[] } | null>(null);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listFacturas({
        page: page + 1,
        pageSize,
        cliente: cliente || undefined,
        pssr: pssr || undefined,
      });
      setRows(result.data);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, cliente, pssr]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isAdmin) listImportBatches().then(setBatches);
  }, [isAdmin, uploadResult]);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const result = await importFacturacion(file);
      setUploadResult(result);
      load();
    } catch (err: any) {
      setUploadResult({
        batch: {} as ImportBatch,
        headerErrors: [err?.response?.data?.error ?? "No se pudo importar el archivo"],
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">Facturación</Typography>
        {isAdmin && (
          <Stack direction="row" spacing={1.5}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              hidden
              onChange={handleFileSelected}
            />
            <Button
              variant="outlined"
              startIcon={<TuneIcon />}
              onClick={() => setConfigDialogOpen(true)}
            >
              Configurar seguimiento
            </Button>
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Cargando..." : "Cargar Excel de facturación"}
            </Button>
          </Stack>
        )}
      </Stack>

      {uploadResult && (
        <Alert
          severity={uploadResult.headerErrors.length > 0 ? "error" : "success"}
          sx={{ mb: 2 }}
          onClose={() => setUploadResult(null)}
        >
          {uploadResult.headerErrors.length > 0 ? (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                No se pudo importar el archivo:
              </Typography>
              {uploadResult.headerErrors.map((e, i) => (
                <Typography key={i} variant="body2">
                  {e}
                </Typography>
              ))}
            </Box>
          ) : (
            <Typography variant="body2">
              Importación completada: {uploadResult.batch.filasNuevas} filas nuevas,{" "}
              {uploadResult.batch.filasActualizadas} actualizadas, {uploadResult.batch.filasError} con error de{" "}
              {uploadResult.batch.filasTotal} totales.
            </Typography>
          )}
        </Alert>
      )}

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
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
          label="Asesor (PSSR)"
          size="small"
          value={pssr}
          onChange={(e) => {
            setPage(0);
            setPssr(e.target.value);
          }}
          sx={{ minWidth: 240 }}
        />
      </Stack>

      <Box sx={{ height: 560, bgcolor: "background.paper", mb: isAdmin ? 3 : 0 }}>
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

      {isAdmin && batches.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Historial de importaciones
          </Typography>
          <List dense>
            {batches.map((b) => (
              <ListItem key={b.id} disableGutters>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <span>{b.nombreArchivo}</span>
                      <Chip
                        size="small"
                        label={b.estado}
                        color={b.estado === "COMPLETADO" ? "success" : b.estado === "FALLIDO" ? "error" : "warning"}
                      />
                    </Stack>
                  }
                  secondary={`${new Date(b.createdAt).toLocaleString("es-CO")} · ${b.subidoPor.nombres} ${b.subidoPor.apellidos} · ${b.filasNuevas} nuevas / ${b.filasActualizadas} actualizadas / ${b.filasError} con error`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <ConfigurarSeguimientoDialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        onSaved={() => {
          setConfigDialogOpen(false);
          load();
        }}
      />
    </Box>
  );
}

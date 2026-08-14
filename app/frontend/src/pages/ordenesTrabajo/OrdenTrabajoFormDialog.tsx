import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Stack,
  Alert,
  Typography,
  Grid,
  Divider,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFileOutlined";
import type {
  EstadoOrdenTrabajo,
  OrdenTrabajo,
  PrioridadOrdenTrabajo,
  TipoServicioOrdenTrabajo,
} from "../../api/types";
import { createOrdenTrabajo, extraerDatosDesdePdf, updateOrdenTrabajo } from "../../api/ordenesTrabajo";
import { listAsesores, type Asesor } from "../../api/asesores";

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

const PRIORIDAD_LABEL: Record<PrioridadOrdenTrabajo, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Props {
  open: boolean;
  orden: OrdenTrabajo | null;
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  fechaSolicitud: today(),
  cliente: "",
  clienteNit: "",
  numeroClienteSap: "",
  asesorPssr: "",
  valor: "",
  horasServicio: "",
  horasDesplazamiento: "",
  ordenTrabajoNumero: "",
  tipoServicio: "PREVENTIVO" as TipoServicioOrdenTrabajo,
  descripcionServicio: "",
  sucursal: "",
  direccion: "",
  ciudad: "",
  departamento: "",
  personaContacto: "",
  correoContacto: "",
  telefonoContacto: "",
  marca: "",
  modelo: "",
  serialMaquina: "",
  coordinadorAltura: false,
  equipoApoyo: false,
  fechaSugerida: "",
  fechaProgramacionReal: "",
  horaServicio: "",
  estado: "RADICADO" as EstadoOrdenTrabajo,
  prioridad: "MEDIA" as PrioridadOrdenTrabajo,
  tecnicoAsignado: "",
  codigoSap: "",
  fechaCierre: "",
  observaciones: "",
  programadorSegunSede: "",
  unidadIntervenirTaller: false,
  tipoTrabajo: "",
  fechaTrasladoTaller: "",
  reporteClick: false,
};

type FormState = typeof emptyForm;

export function OrdenTrabajoFormDialog({ open, orden, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [avisoPdf, setAvisoPdf] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [extrayendo, setExtrayendo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!orden;

  useEffect(() => {
    listAsesores().then(setAsesores);
  }, []);

  const handleEnter = () => {
    setError(null);
    setAvisoPdf(null);
    if (orden) {
      setForm({
        fechaSolicitud: orden.fechaSolicitud.slice(0, 10),
        cliente: orden.cliente,
        clienteNit: orden.clienteNit ?? "",
        numeroClienteSap: orden.numeroClienteSap ?? "",
        asesorPssr: orden.asesorPssr,
        valor: orden.valor ?? "",
        horasServicio: orden.horasServicio ?? "",
        horasDesplazamiento: orden.horasDesplazamiento ?? "",
        ordenTrabajoNumero: orden.ordenTrabajoNumero ?? "",
        tipoServicio: orden.tipoServicio,
        descripcionServicio: orden.descripcionServicio ?? "",
        sucursal: orden.sucursal ?? "",
        direccion: orden.direccion ?? "",
        ciudad: orden.ciudad ?? "",
        departamento: orden.departamento ?? "",
        personaContacto: orden.personaContacto ?? "",
        correoContacto: orden.correoContacto ?? "",
        telefonoContacto: orden.telefonoContacto ?? "",
        marca: orden.marca ?? "",
        modelo: orden.modelo ?? "",
        serialMaquina: orden.serialMaquina ?? "",
        coordinadorAltura: orden.coordinadorAltura,
        equipoApoyo: orden.equipoApoyo,
        fechaSugerida: orden.fechaSugerida ? orden.fechaSugerida.slice(0, 10) : "",
        fechaProgramacionReal: orden.fechaProgramacionReal ? orden.fechaProgramacionReal.slice(0, 10) : "",
        horaServicio: orden.horaServicio ?? "",
        estado: orden.estado,
        prioridad: orden.prioridad,
        tecnicoAsignado: orden.tecnicoAsignado ?? "",
        codigoSap: orden.codigoSap ?? "",
        fechaCierre: orden.fechaCierre ? orden.fechaCierre.slice(0, 10) : "",
        observaciones: orden.observaciones ?? "",
        programadorSegunSede: orden.programadorSegunSede ?? "",
        unidadIntervenirTaller: orden.unidadIntervenirTaller,
        tipoTrabajo: orden.tipoTrabajo ?? "",
        fechaTrasladoTaller: orden.fechaTrasladoTaller ? orden.fechaTrasladoTaller.slice(0, 10) : "",
        reporteClick: orden.reporteClick,
      });
    } else {
      setForm(emptyForm);
    }
  };

  const setField = <K extends keyof FormState>(field: K) => (value: FormState[K]) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleText =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setField(field)(e.target.value as FormState[typeof field]);

  const handleCheck = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setField(field)(e.target.checked as FormState[typeof field]);

  const handlePdfSeleccionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setExtrayendo(true);
    setAvisoPdf(null);
    try {
      const datos = await extraerDatosDesdePdf(file);
      setForm((f) => ({
        ...f,
        cliente: datos.cliente ?? f.cliente,
        clienteNit: datos.clienteNit ?? f.clienteNit,
        numeroClienteSap: datos.numeroClienteSap ?? f.numeroClienteSap,
        ciudad: datos.ciudad ?? f.ciudad,
      }));
      const encontrados = Object.values(datos).filter(Boolean).length;
      setAvisoPdf(
        encontrados > 0
          ? "Se prellenaron Cliente/NIT/Ciudad desde el PDF — revise y complete el resto del formulario."
          : "No se encontró información reconocible en el PDF. Complete el formulario manualmente."
      );
    } catch {
      setAvisoPdf("No se pudo leer el PDF. Complete el formulario manualmente.");
    } finally {
      setExtrayendo(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSaving(true);
    try {
      const input = {
        fechaSolicitud: form.fechaSolicitud,
        cliente: form.cliente,
        clienteNit: form.clienteNit || undefined,
        numeroClienteSap: form.numeroClienteSap || undefined,
        asesorPssr: form.asesorPssr,
        valor: form.valor === "" ? undefined : Number(form.valor),
        horasServicio: form.horasServicio === "" ? undefined : Number(form.horasServicio),
        horasDesplazamiento: form.horasDesplazamiento === "" ? undefined : Number(form.horasDesplazamiento),
        ordenTrabajoNumero: form.ordenTrabajoNumero || undefined,
        tipoServicio: form.tipoServicio,
        descripcionServicio: form.descripcionServicio || undefined,
        sucursal: form.sucursal || undefined,
        direccion: form.direccion || undefined,
        ciudad: form.ciudad || undefined,
        departamento: form.departamento || undefined,
        personaContacto: form.personaContacto || undefined,
        correoContacto: form.correoContacto || undefined,
        telefonoContacto: form.telefonoContacto || undefined,
        marca: form.marca || undefined,
        modelo: form.modelo || undefined,
        serialMaquina: form.serialMaquina || undefined,
        coordinadorAltura: form.coordinadorAltura,
        equipoApoyo: form.equipoApoyo,
        fechaSugerida: form.fechaSugerida || undefined,
        fechaProgramacionReal: form.fechaProgramacionReal || undefined,
        horaServicio: form.horaServicio || undefined,
        estado: form.estado,
        prioridad: form.prioridad,
        tecnicoAsignado: form.tecnicoAsignado || undefined,
        codigoSap: form.codigoSap || undefined,
        fechaCierre: form.fechaCierre || undefined,
        observaciones: form.observaciones || undefined,
        programadorSegunSede: form.programadorSegunSede || undefined,
        unidadIntervenirTaller: form.unidadIntervenirTaller,
        tipoTrabajo: form.tipoTrabajo || undefined,
        fechaTrasladoTaller: form.fechaTrasladoTaller || undefined,
        reporteClick: form.reporteClick,
      };

      if (isEdit && orden) {
        await updateOrdenTrabajo(orden.id, input);
      } else {
        await createOrdenTrabajo(input);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "No se pudo guardar la orden de trabajo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{ transition: { onEnter: handleEnter } }}
    >
      <DialogTitle>{isEdit ? `Editar orden de trabajo #${orden?.numero}` : "Nueva orden de trabajo"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadFileIcon />}
              disabled={extrayendo}
              onClick={() => fileInputRef.current?.click()}
            >
              {extrayendo ? "Leyendo PDF..." : "Cargar desde PDF"}
            </Button>
            <Typography variant="caption" color="text.secondary">
              Prellena Cliente/NIT/Ciudad si el PDF los trae; el resto se completa a mano.
            </Typography>
            <input ref={fileInputRef} type="file" accept="application/pdf" hidden onChange={handlePdfSeleccionado} />
          </Stack>
          {avisoPdf && <Alert severity="info">{avisoPdf}</Alert>}

          <Divider textAlign="left">Solicitud</Divider>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Fecha de solicitud"
                type="date"
                value={form.fechaSolicitud}
                onChange={handleText("fechaSolicitud")}
                slotProps={{ inputLabel: { shrink: true } }}
                required
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField label="Cliente" value={form.cliente} onChange={handleText("cliente")} required fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Asesor (PSSR)"
                value={form.asesorPssr}
                onChange={handleText("asesorPssr")}
                required
                fullWidth
              >
                {asesores.map((a) => (
                  <MenuItem key={a.id} value={a.nombreCompleto}>
                    {a.nombreCompleto}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Orden de trabajo (SAP/Pedido)"
                value={form.ordenTrabajoNumero}
                onChange={handleText("ordenTrabajoNumero")}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                label="Tipo de servicio"
                value={form.tipoServicio}
                onChange={handleText("tipoServicio")}
                required
                fullWidth
              >
                {(Object.keys(TIPO_SERVICIO_LABEL) as TipoServicioOrdenTrabajo[]).map((t) => (
                  <MenuItem key={t} value={t}>
                    {TIPO_SERVICIO_LABEL[t]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Valor"
                type="number"
                value={form.valor}
                onChange={handleText("valor")}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <TextField
                label="Horas servicio"
                type="number"
                value={form.horasServicio}
                onChange={handleText("horasServicio")}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <TextField
                label="Horas despl."
                type="number"
                value={form.horasDesplazamiento}
                onChange={handleText("horasDesplazamiento")}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Descripción del servicio"
                value={form.descripcionServicio}
                onChange={handleText("descripcionServicio")}
                multiline
                minRows={2}
                fullWidth
              />
            </Grid>
          </Grid>

          <Divider textAlign="left">Cliente y contacto</Divider>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="NIT / CI cliente" value={form.clienteNit} onChange={handleText("clienteNit")} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Número de cliente (SAP)"
                value={form.numeroClienteSap}
                onChange={handleText("numeroClienteSap")}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Sucursal" value={form.sucursal} onChange={handleText("sucursal")} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Dirección" value={form.direccion} onChange={handleText("direccion")} fullWidth />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField label="Ciudad" value={form.ciudad} onChange={handleText("ciudad")} fullWidth />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField label="Departamento" value={form.departamento} onChange={handleText("departamento")} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Persona de contacto"
                value={form.personaContacto}
                onChange={handleText("personaContacto")}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Correo de contacto"
                type="email"
                value={form.correoContacto}
                onChange={handleText("correoContacto")}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Teléfono de contacto"
                value={form.telefonoContacto}
                onChange={handleText("telefonoContacto")}
                fullWidth
              />
            </Grid>
          </Grid>

          <Divider textAlign="left">Equipo</Divider>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Marca" value={form.marca} onChange={handleText("marca")} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Modelo" value={form.modelo} onChange={handleText("modelo")} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Serial de máquina"
                value={form.serialMaquina}
                onChange={handleText("serialMaquina")}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControlLabel
                control={<Checkbox checked={form.coordinadorAltura} onChange={handleCheck("coordinadorAltura")} />}
                label="Coordinador de altura"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControlLabel
                control={<Checkbox checked={form.equipoApoyo} onChange={handleCheck("equipoApoyo")} />}
                label="Equipo de apoyo"
              />
            </Grid>
          </Grid>

          <Divider textAlign="left">Programación y cierre</Divider>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Fecha sugerida"
                type="date"
                value={form.fechaSugerida}
                onChange={handleText("fechaSugerida")}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Fecha de programación real"
                type="date"
                value={form.fechaProgramacionReal}
                onChange={handleText("fechaProgramacionReal")}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Hora del servicio"
                placeholder="16:40"
                value={form.horaServicio}
                onChange={handleText("horaServicio")}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField select label="Estado" value={form.estado} onChange={handleText("estado")} fullWidth>
                {(Object.keys(ESTADO_LABEL) as EstadoOrdenTrabajo[]).map((e) => (
                  <MenuItem key={e} value={e}>
                    {ESTADO_LABEL[e]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField select label="Prioridad" value={form.prioridad} onChange={handleText("prioridad")} fullWidth>
                {(Object.keys(PRIORIDAD_LABEL) as PrioridadOrdenTrabajo[]).map((p) => (
                  <MenuItem key={p} value={p}>
                    {PRIORIDAD_LABEL[p]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Técnico asignado"
                value={form.tecnicoAsignado}
                onChange={handleText("tecnicoAsignado")}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Código SAP" value={form.codigoSap} onChange={handleText("codigoSap")} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Programador según sede"
                value={form.programadorSegunSede}
                onChange={handleText("programadorSegunSede")}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Tipo de trabajo"
                value={form.tipoTrabajo}
                onChange={handleText("tipoTrabajo")}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox checked={form.unidadIntervenirTaller} onChange={handleCheck("unidadIntervenirTaller")} />
                }
                label="Unidad a taller"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Fecha traslado a taller"
                type="date"
                value={form.fechaTrasladoTaller}
                onChange={handleText("fechaTrasladoTaller")}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                disabled={!form.unidadIntervenirTaller}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControlLabel
                control={<Checkbox checked={form.reporteClick} onChange={handleCheck("reporteClick")} />}
                label="Reporte Click"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Fecha de cierre"
                type="date"
                value={form.fechaCierre}
                onChange={handleText("fechaCierre")}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Observaciones"
                value={form.observaciones}
                onChange={handleText("observaciones")}
                multiline
                minRows={2}
                fullWidth
              />
            </Grid>
          </Grid>

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

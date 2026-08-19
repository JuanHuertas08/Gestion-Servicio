import { prisma } from "../../config/prisma";
import { HttpError } from "../../middleware/errorHandler";
import { AccionAuditoria } from "@prisma/client";

const MESES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * Registra o vincula el técnico en el maestro cuando se crea/edita un usuario con rol
 * Técnico de Servicio. Mismo patrón que registrarAsesorDeUsuario: si ya existe un técnico con
 * ese nombre (creado desde la pantalla de Alistamientos) lo vincula en vez de duplicarlo.
 */
export async function registrarTecnicoDeUsuario(params: {
  userId: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
}) {
  const { userId, nombres, apellidos, correo, telefono } = params;

  const existentePorUser = await prisma.tecnico.findUnique({ where: { userId } });
  if (existentePorUser) {
    await prisma.tecnico.update({ where: { userId }, data: { correo, telefono, activo: true } });
    return;
  }

  const existentePorNombre = await prisma.tecnico.findFirst({
    where: { nombres, apellidos, userId: null },
  });

  if (existentePorNombre) {
    await prisma.tecnico.update({
      where: { id: existentePorNombre.id },
      data: { userId, correo, telefono, activo: true },
    });
    return;
  }

  await prisma.tecnico.create({
    data: { nombres, apellidos, correo, telefono, userId, activo: true },
  });
}

export async function desvincularTecnicoDeUsuario(userId: string) {
  await prisma.tecnico.updateMany({ where: { userId }, data: { userId: null } });
}

export async function setTecnicoActivoPorUsuario(userId: string, activo: boolean) {
  await prisma.tecnico.updateMany({ where: { userId }, data: { activo } });
}

export interface CapacidadInput {
  mes: number; // 1-12
  capacidadDiaria: number;
}

export interface TecnicoInput {
  nombres: string;
  apellidos: string;
  cargo?: string;
  telefono?: string;
  correo?: string;
  capacidades?: CapacidadInput[];
}

function validarCapacidades(capacidades: CapacidadInput[] | undefined) {
  if (!capacidades) return;
  capacidades.forEach((c) => {
    if (!MESES.includes(c.mes)) throw new HttpError(400, `Mes inválido: ${c.mes}`);
    if (c.capacidadDiaria < 0) throw new HttpError(400, "La capacidad diaria no puede ser negativa");
  });
}

export async function createTecnico(input: TecnicoInput, actorUserId: string) {
  validarCapacidades(input.capacidades);

  const tecnico = await prisma.tecnico.create({
    data: {
      nombres: input.nombres,
      apellidos: input.apellidos,
      cargo: input.cargo,
      telefono: input.telefono,
      correo: input.correo,
      capacidades: {
        create: MESES.map((mes) => ({
          mes,
          capacidadDiaria: input.capacidades?.find((c) => c.mes === mes)?.capacidadDiaria ?? 0,
        })),
      },
    },
    include: { capacidades: true },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      accion: AccionAuditoria.CREAR,
      entidad: "Tecnico",
      cambios: { tecnicoId: tecnico.id, nombres: tecnico.nombres, apellidos: tecnico.apellidos },
    },
  });

  return tecnico;
}

export async function updateTecnico(id: string, input: Partial<TecnicoInput>, actorUserId: string) {
  const existing = await prisma.tecnico.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Técnico no encontrado");
  validarCapacidades(input.capacidades);

  const data: Record<string, unknown> = {};
  const cambios: Record<string, { antes: unknown; despues: unknown }> = {};

  (["nombres", "apellidos", "cargo", "telefono", "correo"] as const).forEach((campo) => {
    const valor = input[campo];
    if (valor !== undefined && valor !== existing[campo]) {
      cambios[campo] = { antes: existing[campo], despues: valor };
      data[campo] = valor;
    }
  });

  if (Object.keys(data).length > 0) {
    await prisma.tecnico.update({ where: { id }, data });
  }

  if (input.capacidades) {
    await prisma.$transaction(
      input.capacidades.map((c) =>
        prisma.capacidadTecnico.upsert({
          where: { tecnicoId_mes: { tecnicoId: id, mes: c.mes } },
          create: { tecnicoId: id, mes: c.mes, capacidadDiaria: c.capacidadDiaria },
          update: { capacidadDiaria: c.capacidadDiaria },
        })
      )
    );
    cambios.capacidades = { antes: "(ver historial)", despues: input.capacidades };
  }

  if (Object.keys(cambios).length > 0) {
    await prisma.auditLog.create({
      data: {
        actorUserId,
        accion: AccionAuditoria.EDITAR,
        entidad: "Tecnico",
        cambios: { tecnicoId: id, ...cambios },
      },
    });
  }

  return getTecnico(id);
}

export async function setTecnicoActivo(id: string, activo: boolean, actorUserId: string) {
  const existing = await prisma.tecnico.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Técnico no encontrado");
  if (existing.userId) {
    throw new HttpError(
      400,
      "Este técnico tiene una cuenta de usuario vinculada; gestione su estado desde Usuarios"
    );
  }

  const tecnico = await prisma.tecnico.update({ where: { id }, data: { activo } });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      accion: activo ? AccionAuditoria.REACTIVAR : AccionAuditoria.INACTIVAR,
      entidad: "Tecnico",
      cambios: { tecnicoId: id, nombres: tecnico.nombres, apellidos: tecnico.apellidos },
    },
  });

  return tecnico;
}

export async function getTecnico(id: string) {
  const tecnico = await prisma.tecnico.findUnique({
    where: { id },
    include: { capacidades: { orderBy: { mes: "asc" } } },
  });
  if (!tecnico) throw new HttpError(404, "Técnico no encontrado");
  return tecnico;
}

export interface ListTecnicosParams {
  estado?: "ACTIVO" | "INACTIVO";
}

export async function listTecnicos(params: ListTecnicosParams) {
  const { estado } = params;
  return prisma.tecnico.findMany({
    where: estado ? { activo: estado === "ACTIVO" } : {},
    orderBy: [{ nombres: "asc" }, { apellidos: "asc" }],
    include: { capacidades: { orderBy: { mes: "asc" } } },
  });
}

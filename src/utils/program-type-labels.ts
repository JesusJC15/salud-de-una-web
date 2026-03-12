import { ProgramType } from "../types/enums";
import { translateEnumValue } from "./enum-labels";

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  [ProgramType.DOCTORATE]: "Doctorado",
  [ProgramType.UNDEFINED]: "Sin definir",
  [ProgramType.PROFESSIONAL_TECHNICAL]: "Tecnico profesional",
  [ProgramType.MASTERS]: "Maestria",
  [ProgramType.TECHNOLOGY]: "Tecnologia",
  [ProgramType.SPECIALIZATION]: "Especializacion",
  [ProgramType.UNIVERSITY]: "Universitario",
  [ProgramType.ASSISTANT]: "Auxiliar",
};

export function translateProgramType(type: string | undefined): string {
  return translateEnumValue(PROGRAM_TYPE_LABELS, type);
}
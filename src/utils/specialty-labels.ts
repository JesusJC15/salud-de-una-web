import { Specialty } from "../types/enums";
import { translateEnumValue } from "./enum-labels";

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  [Specialty.GENERAL_MEDICINE]: "Medicina general",
  [Specialty.ODONTOLOGY]: "Odontologia",
};

export function translateSpecialty(type: string | undefined): string {
  return translateEnumValue(SPECIALTY_LABELS, type);
}
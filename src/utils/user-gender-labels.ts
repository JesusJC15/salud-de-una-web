import { UserGender } from "../types/enums";
import { translateEnumValue } from "./enum-labels";

export const USER_GENDER_LABELS: Record<UserGender, string> = {
  [UserGender.MALE]: "Masculino",
  [UserGender.FEMALE]: "Femenino",
  [UserGender.OTHER]: "Otro",
};

export function translateUserGender(type: string | undefined): string {
  return translateEnumValue(USER_GENDER_LABELS, type);
}
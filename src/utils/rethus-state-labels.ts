import { RethusState } from "../types/enums";
import { translateEnumValue } from "./enum-labels";

export const RETHUS_STATE_LABELS: Record<RethusState, string> = {
  [RethusState.VALID]: "Valido",
  [RethusState.EXPIRED]: "Expirado",
  [RethusState.PENDING]: "Pendiente",
};

export function translateRethusState(type: string | undefined): string {
  return translateEnumValue(RETHUS_STATE_LABELS, type);
}
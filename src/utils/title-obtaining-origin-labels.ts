import { TitleObtainingOrigin } from "../types/enums";
import { translateEnumValue } from "./enum-labels";

export const TITLE_OBTAINING_ORIGIN_LABELS: Record<
  TitleObtainingOrigin,
  string
> = {
  [TitleObtainingOrigin.LOCAL]: "Local",
  [TitleObtainingOrigin.FOREIGN]: "Extranjero",
};

export function translateTitleObtainingOrigin(
  type: string | undefined,
): string {
  return translateEnumValue(TITLE_OBTAINING_ORIGIN_LABELS, type);
}
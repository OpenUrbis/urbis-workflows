import { FieldTypeEnum, IField } from "@open-urbis/types";
import {
  defaultOptionsSection,
  expressionsSection,
  commonDefaultFields,
  sharedExpressionFields,
  controlSection,
  controlDefaultFields,
} from "./shared";

/**
 * Field config for "mapPicker" (DWG / MapDataIntegrationField).
 * Kept minimal for testing; extend when migrating from legacy map.
 */
export const createMapPickerConfig = (): IField => {
  return {
    key: "field-editor",
    type: FieldTypeEnum.Block,
    options: {},
    expressions: {},
    block: [
      { ...defaultOptionsSection, block: commonDefaultFields },
      { ...expressionsSection, block: sharedExpressionFields },
      { ...controlSection, block: controlDefaultFields },
    ],
  };
};

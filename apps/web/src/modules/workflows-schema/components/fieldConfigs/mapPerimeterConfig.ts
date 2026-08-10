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
 * Field config for "mapPerimeter" (Perimeter — @open-urbis/map MapPicker).
 * Kept minimal for schema editor; behaves similarly to mapPickerConfig.
 */
export const createMapPerimeterConfig = (): IField => {
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


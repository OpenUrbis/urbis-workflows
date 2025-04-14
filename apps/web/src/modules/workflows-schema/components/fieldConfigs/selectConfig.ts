import { FieldTypeEnum, IField } from "@open-urbis/types";
import {
  defaultOptionsSection,
  expressionsSection,
  placeholderField,
  selectionDefaultFields,
  sharedExpressionFields,
  specificOptionsSection,
  controlSection,
  controlDefaultFields,
} from "./shared";

export const createSelectConfig = (): IField => {
  const config = {
    key: "field-editor",
    type: FieldTypeEnum.Block,
    options: {},
    expressions: {},
    block: [
      {
        ...defaultOptionsSection,
        block: selectionDefaultFields,
      },
      {
        ...specificOptionsSection,
        block: [placeholderField],
      },
      {
        ...expressionsSection,
        block: sharedExpressionFields,
      },
      {
        ...controlSection,
        block: controlDefaultFields,
      },
    ],
  };

  return config;
};

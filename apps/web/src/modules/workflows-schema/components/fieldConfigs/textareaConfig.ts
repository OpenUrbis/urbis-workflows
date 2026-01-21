import { FieldTypeEnum, IField } from "@open-urbis/types";
import {
  defaultOptionsSection,
  expressionsSection,
  specificOptionsSection,
  sharedExpressionFields,
  commonDefaultFields,
  placeholderField,
  controlSection,
  controlDefaultFields,
} from "./shared";

export const createTextareaConfig = (): IField => {
  const config = {
    key: "field-editor",
    type: FieldTypeEnum.Block,
    options: {},
    expressions: {},
    block: [
      {
        ...defaultOptionsSection,
        block: commonDefaultFields,
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

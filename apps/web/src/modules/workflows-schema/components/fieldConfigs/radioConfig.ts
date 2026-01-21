import { FieldTypeEnum, IField } from "@open-urbis/types";
import {
  defaultOptionsSection,
  expressionsSection,
  selectionDefaultFields,
  sharedExpressionFields,
  controlSection,
  controlDefaultFields,
} from "./shared";

export const createRadioConfig = (): IField => {
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

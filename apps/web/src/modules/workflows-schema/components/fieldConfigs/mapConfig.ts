import { FieldTypeEnum, IField } from "@open-urbis/types";
import {
  defaultOptionsSection,
  expressionsSection,
  commonDefaultFields,
  sharedExpressionFields,
  specificOptionsSection,
  controlSection,
  controlDefaultFields,
} from "./shared";

const tableField: IField = {
  key: "$.options.table",
  type: FieldTypeEnum.Radio,
  options: {
    label: "Quadro",
    items: [
      {
        label: "Sim",
        value: true,
      },
      {
        label: "Não",
        value: false,
      },
    ],
  },
  expressions: {},
};

export const createMapConfig = (): IField => {
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
        block: [tableField],
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

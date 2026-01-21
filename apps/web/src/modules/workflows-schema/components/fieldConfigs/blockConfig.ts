import { FieldTypeEnum, IField, IFieldOptionsType } from "@open-urbis/types";
import {
  defaultOptionsSection,
  expressionsSection,
  keyField,
  tooltipField,
  documentationField,
  sharedExpressionFields,
} from "./shared";

const toggleField = {
  key: "$.options.toggle",
  type: FieldTypeEnum.Radio,
  options: {
    label: "Mostrar controle de visibilidade",
    items: [
      { label: "Sim", value: true },
      { label: "Não", value: false },
    ],
  } as IFieldOptionsType,
  expressions: {},
};

export const createBlockConfig = (): IField => {
  const config = {
    key: "field-editor",
    type: FieldTypeEnum.Block,
    options: {},
    expressions: {},
    block: [
      {
        ...defaultOptionsSection,
        block: [keyField, tooltipField, documentationField],
      },
      {
        key: "specific-options",
        type: FieldTypeEnum.Block,
        options: {
          label: "Opções Específicas",
          card: true,
          hideCardBorder: true,
        },
        expressions: {},
        block: [toggleField],
      },
      {
        ...expressionsSection,
        block: sharedExpressionFields,
      },
    ],
  };

  return config;
};

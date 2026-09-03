import { FieldTypeEnum, IField } from "@open-urbis/types";
import {
  defaultOptionsSection,
  expressionsSection,
  keyField,
  enableApostilleField,
  tooltipField,
  documentationField,
  sharedExpressionFields,
  controlSection,
  controlDefaultFields,
} from "./shared";

const tableField = {
  key: "$.options.table",
  type: FieldTypeEnum.Textarea,
  options: {
    label: "Tabela",
    code: true,
    tooltip: "Configure a estrutura da tabela em formato JSON",
  },
  expressions: {},
};

const columnsField = {
  key: "$.options.columns",
  type: FieldTypeEnum.Input,
  options: {
    label: "Número de Colunas",
    type: "number",
  },
  expressions: {},
};

const widthField = {
  key: "$.options.width",
  type: FieldTypeEnum.Input,
  options: {
    label: "Largura",
  },
  expressions: {},
};

export const createTableConfig = (): IField => {
  const config = {
    key: "field-editor",
    type: FieldTypeEnum.Block,
    options: {},
    expressions: {},
    block: [
      {
        ...defaultOptionsSection,
        block: [
          keyField,
          enableApostilleField,
          tooltipField,
          documentationField,
        ],
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
        block: [tableField, columnsField, widthField],
      },
      {
        ...expressionsSection,
        block: sharedExpressionFields.filter((field) =>
          [
            "$.expressions.model",
            "$.expressions.modelDescription",
            "$.expressions.visible",
            "$.expressions.valid",
          ].includes(field.key)
        ),
      },
      {
        ...controlSection,
        block: controlDefaultFields,
      },
    ],
  };

  return config;
};

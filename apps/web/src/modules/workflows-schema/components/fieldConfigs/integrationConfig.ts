import { FieldTypeEnum, IField, IFieldOptionsType } from "@open-urbis/types";
import {
  defaultOptionsSection,
  expressionsSection,
  keyField,
  enableApostilleField,
  tooltipField,
  documentationField,
  controlSection,
  controlDefaultFields,
} from "./shared";

const showLogField = {
  key: "$.options.log",
  type: FieldTypeEnum.Radio,
  options: {
    label: "Mostrar registro",
    items: [
      { label: "Sim", value: true },
      { label: "Não", value: false },
    ],
  } as IFieldOptionsType,
  expressions: {},
};

const integrationExpression = {
  key: "$.expressions.integration",
  type: FieldTypeEnum.Textarea,
  options: {
    label: "Integração",
    code: true,
    tooltip: `Retorno esperado 
<pre style="border: 1px solid;border-radius: 8px;padding: 8px;margin-left: 16px;">(() => ({ "method": "GET", "url": "ex.: https://api.com/api/v1/resource", "headers": {} }))()</pre>`,
  },
  expressions: {},
};

const validExpression = {
  key: "$.expressions.valid",
  type: FieldTypeEnum.Textarea,
  options: {
    label: "Validação",
    code: true,
  },
  expressions: {},
};

const logExpression = {
  key: "$.expressions.log",
  type: FieldTypeEnum.Textarea,
  options: {
    label: "Registro",
    code: true,
  },
  expressions: {},
};

export const createIntegrationConfig = (): IField => {
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
        ...expressionsSection,
        block: [
          integrationExpression,
          validExpression,
          logExpression,
          showLogField,
        ],
      },
      {
        ...controlSection,
        block: controlDefaultFields,
      },
    ],
  };

  return config;
};

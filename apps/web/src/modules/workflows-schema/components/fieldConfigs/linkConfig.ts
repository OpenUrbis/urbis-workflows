import { FieldTypeEnum, IField } from "@open-urbis/types";
import {
  defaultOptionsSection,
  expressionsSection,
  keyField,
  enableApostilleField,
  tooltipField,
  documentationField,
  controlDefaultFields,
  controlSection,
} from "./shared";

const modelExpression = {
  key: "$.expressions.model",
  type: FieldTypeEnum.Textarea,
  options: {
    label: "Modelo",
    code: true,
    tooltip: `Retorno esperado 
<pre style="border: 1px solid;border-radius: 8px;padding: 8px;margin-left: 16px;">(() => ({ "from": "VINCULADO", "to": "VINCULANTE", "by": "TIPO_DE_VINCULO" }))()</pre>`,
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

export const createLinkConfig = (): IField => {
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
        block: [modelExpression, validExpression],
      },
      {
        ...controlSection,
        block: controlDefaultFields,
      },
    ],
  };

  return config;
};

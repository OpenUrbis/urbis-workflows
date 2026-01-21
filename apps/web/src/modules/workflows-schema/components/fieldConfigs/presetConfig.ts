import { FieldTypeEnum, IField } from "@open-urbis/types";
import {
  defaultOptionsSection,
  expressionsSection,
  enableApostilleField,
  documentationField,
} from "./shared";

const customKeyField = {
  key: "$.options.key",
  type: FieldTypeEnum.Input,
  options: {
    label: "Chave Personalizada",
  },
  expressions: {},
};

const visibleExpression = {
  key: "$.expressions.visible",
  type: FieldTypeEnum.Textarea,
  options: {
    label: "Visibilidade",
    code: true,
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

export const createPresetConfig = (): IField => {
  const config = {
    key: "field-editor",
    type: FieldTypeEnum.Block,
    options: {},
    expressions: {},
    block: [
      {
        ...defaultOptionsSection,
        block: [
          customKeyField,
          enableApostilleField,
          documentationField,
        ],
      },
      {
        ...expressionsSection,
        block: [
          visibleExpression,
          validExpression,
        ],
      },
    ],
  };

  return config;
}; 
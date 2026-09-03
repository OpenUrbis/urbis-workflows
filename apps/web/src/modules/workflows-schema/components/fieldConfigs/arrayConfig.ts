import { FieldTypeEnum, IField } from "@open-urbis/types";
import {
  defaultOptionsSection,
  expressionsSection,
  commonDefaultFields,
  sharedExpressionFields,
} from "./shared";

const layoutField = {
  key: "$.options.layout",
  type: FieldTypeEnum.Input,
  options: {
    label: "Layout",
  },
  expressions: {},
};

export const createArrayConfig = (): IField => {
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
        key: "specific-options",
        type: FieldTypeEnum.Block,
        options: {
          label: "Opções Específicas",
          card: true,
          hideCardBorder: true,
        },
        expressions: {},
        block: [layoutField],
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
    ],
  };

  return config;
};

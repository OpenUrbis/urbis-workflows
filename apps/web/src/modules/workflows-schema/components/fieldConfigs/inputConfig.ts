import {
  FieldTypeEnum,
  IField,
  IFieldOptionsType,
  InputOptions,
} from "@open-urbis/types";
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

const typeField = {
  key: "$.options.type",
  type: FieldTypeEnum.Radio,
  options: {
    label: "Tipo do campo",
    items: [
      { label: "Texto", value: "text" },
      { label: "Área", value: "area" },
      { label: "Moeda", value: "currency" },
      { label: "Porcentagem", value: "percentage" },
    ],
  } as IFieldOptionsType,
  expressions: {},
};

const decimalScaleField = {
  key: "$.options.decimalScale",
  type: FieldTypeEnum.Input,
  options: {
    label: "Casas decimais",
    type: "number",
  } as InputOptions,
  expressions: {
    visible:
      "context['$.options.type'] === 'currency' || context['$.options.type'] === 'percentage'",
  },
};

const maskField = {
  key: "$.options.mask",
  type: FieldTypeEnum.Input,
  options: {
    label: "Máscara",
    required: false,
  } as InputOptions,
  expressions: {
    visible: "context['$.options.type'] === 'text'",
  },
};

export const createInputConfig = (): IField => {
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
        block: [placeholderField, typeField, decimalScaleField, maskField],
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

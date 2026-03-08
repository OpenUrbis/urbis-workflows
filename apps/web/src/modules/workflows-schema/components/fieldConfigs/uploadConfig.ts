import { FieldTypeEnum, IField, IFieldOptionsType } from "@open-urbis/types";
import {
  defaultOptionsSection,
  expressionsSection,
  commonDefaultFields,
  sharedExpressionFields,
  controlSection,
  controlDefaultFields,
} from "./shared";

const galleryField: IField = {
  key: "$.options.gallery",
  type: FieldTypeEnum.Radio,
  options: {
    label: "Mostrar Galeria",
    items: [
      { label: "Sim", value: true },
      { label: "Não", value: false },
    ],
  } as IFieldOptionsType,
  expressions: {},
};

const maxSizeField: IField = {
  key: "$.options.maxSize",
  type: FieldTypeEnum.Input,
  options: {
    label: "Tamanho máximo do arquivo (em bytes)",
    type: "number",
  },
  expressions: {},
};

const multipleField: IField = {
  key: "$.options.multiple",
  type: FieldTypeEnum.Radio,
  options: {
    label: "Permitir múltiplos arquivos",
    items: [
      { label: "Sim", value: true },
      { label: "Não", value: false },
    ],
  },
  expressions: {},
};

const seiIntegrationField: IField = {
  key: "$.options.integration",
  type: FieldTypeEnum.Block,
  options: {
    label: "SEI",
  },
  expressions: {},
  block: [
    {
      key: "mirrorToSei",
      type: FieldTypeEnum.Radio,
      options: {
        label: "Espelhar documento no SEI?",
        items: [
          { label: "Sim", value: true },
          { label: "Não", value: false },
        ],
      },
      expressions: {},
    },
    {
      key: "accessLevel",
      type: FieldTypeEnum.Radio,
      options: {
        label: "Nível de acesso no SEI?",
        items: [
          { label: "Público", value: "public" },
          { label: "Restrito", value: "private" },
        ],
      },
      expressions: {},
    },
    {
      key: "legalHypothesis",
      type: FieldTypeEnum.Integration,
      options: {},
      expressions: {
        integration: `{ method: 'GET', url: '${import.meta.env.VITE_BACK_END_API}/integrations/sei/legal-hypothesis' }`,
      },
    },
    {
      key: "privateHypotesisId",
      type: FieldTypeEnum.Select,
      options: {
        label: "Identificador da Hipótese Legal?",
      },
      expressions: {
        visible: "context.accessLevel === 'private'",
        options:
          "{ items: Object.values(context.legalHypothesis).map((h) => ({ key: h.name, value: h.id })) }",
      },
    },
    {
      key: "priority",
      type: FieldTypeEnum.Input,
      options: {
        type: "number",
        label: "Nível de prioridade na ordem de envio dos documentos",
      },
      expressions: {},
    },
  ],
};

export const createUploadConfig = (): IField => {
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
        block: [maxSizeField, multipleField, galleryField, seiIntegrationField],
      },
      {
        ...expressionsSection,
        block: sharedExpressionFields.filter((field) =>
          ["$.expressions.visible", "$.expressions.valid"].includes(field.key)
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

import { FieldTypeEnum, IField } from "@open-urbis/types";

const layersField = {
  key: "$.options.layers",
  type: FieldTypeEnum.Block,
  options: {
    label: "Camadas",
  },
  expressions: {},
};

const sourceField = {
  key: "$.options.source",
  type: FieldTypeEnum.Input,
  options: {
    label: "GeoJSON",
    tooltip: "Caminho do GeoJSON para a camada de mapas",
  },
  expressions: {},
};

export const createDocumentMapConfig = (): IField => {
  const config = {
    key: "field-editor",
    type: FieldTypeEnum.Block,
    options: {},
    expressions: {},
    block: [
      {
        key: "specific-options",
        type: FieldTypeEnum.Block,
        options: {
          label: "Opções Específicas",
          card: true,
          hideCardBorder: true,
        },
        expressions: {},
        block: [layersField, sourceField],
      },
    ],
  };

  return config;
};

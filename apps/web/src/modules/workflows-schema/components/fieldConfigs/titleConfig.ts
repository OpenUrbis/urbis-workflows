import { FieldTypeEnum, IField } from "@open-urbis/types";
import { defaultOptionsSection, expressionsSection, tooltipField, tooltipExpressions } from "./shared";

const createTitleConfig = (isSubtitle = false): IField => {
  const config = {
    key: "field-editor",
    type: FieldTypeEnum.Block,
    options: {},
    expressions: {},
    block: [
      {
        ...defaultOptionsSection,
        block: [tooltipField],
      },
      {
        ...expressionsSection,
        block: [
          {
            key: "$.expressions.visible",
            type: FieldTypeEnum.Textarea,
            options: {
              label: "Visibilidade",
              tooltip: tooltipExpressions,
              code: true,
            },
            expressions: {},
          },
        ],
      },
    ],
  };

  return config;
};

export const createTitleFieldConfig = (): IField => createTitleConfig(false);
export const createSubtitleFieldConfig = (): IField => createTitleConfig(true); 
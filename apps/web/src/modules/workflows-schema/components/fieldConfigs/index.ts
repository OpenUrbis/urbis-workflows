import { FieldTypeEnum, IField } from "@open-urbis/types";
import { createInputConfig } from "./inputConfig";
import {
  createTitleFieldConfig,
  createSubtitleFieldConfig,
} from "./titleConfig";
import { createTextareaConfig } from "./textareaConfig";
import { createSelectConfig } from "./selectConfig";
import { createRadioConfig } from "./radioConfig";
import { createCheckboxConfig } from "./checkboxConfig";
import { createUploadConfig } from "./uploadConfig";
import { createLinkConfig } from "./linkConfig";
import { createIntegrationConfig } from "./integrationConfig";
import { createMapConfig } from "./mapConfig";
import { createBlockConfig } from "./blockConfig";
import { createPresetConfig } from "./presetConfig";
import { createArrayConfig } from "./arrayConfig";
import { createTableConfig } from "./tableConfig";
import { createDocumentMapConfig } from "./documentMapConfig";

export const createFieldConfig = (field: IField): IField => {
  switch (field.type) {
    case FieldTypeEnum.Input:
      return createInputConfig();
    case FieldTypeEnum.Title:
      return createTitleFieldConfig();
    case FieldTypeEnum.Subtitle:
      return createSubtitleFieldConfig();
    case FieldTypeEnum.Textarea:
      return createTextareaConfig();
    case FieldTypeEnum.Select:
      return createSelectConfig();
    case FieldTypeEnum.Radio:
      return createRadioConfig();
    case FieldTypeEnum.Checkbox:
      return createCheckboxConfig();
    case FieldTypeEnum.Upload:
      return createUploadConfig();
    case FieldTypeEnum.Link:
      return createLinkConfig();
    case FieldTypeEnum.Integration:
      return createIntegrationConfig();
    case FieldTypeEnum.Map:
      return createMapConfig();
    case FieldTypeEnum.Block:
      return createBlockConfig();
    case FieldTypeEnum.Preset:
      return createPresetConfig();
    case FieldTypeEnum.Array:
      return createArrayConfig();
    case FieldTypeEnum.Table:
      return createTableConfig();
    case "documentMap" as any:
      return createDocumentMapConfig();
    default:
      return field;
  }
};

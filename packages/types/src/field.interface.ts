import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import {
  BlockOptions,
  CheckboxOptions,
  InputOptions,
  LinkOptions,
  IntegrationOptions,
  MapOptions,
  PresetOptions,
  RadioOptions,
  SelectOptions,
  SubtitleOptions,
  TextAreaOptions,
  TitleOptions,
  UploadOptions,
  ArrayOptions,
  TableOptions,
} from "./options.interface";
import { User } from "./user.interface";

export type IFormContext = {
  $data?: any; // current data from the form
  $modules?: any; // modules imported to be used in the form
  $user?: User; // current user data filling the form
  $variables?: any; // variables imported to be used in the form
  $state?: "create" | "edition" | "edition-internal" | "view" | "editor"; // current state from the form

  // experimental
  $tree?: any; // list of references to fields that the field uses in its expressions
  $history?: any; // contain the history of changes of the data form
  $commits?: any[];
};

export enum FieldTypeEnum {
  Array = "array",
  Block = "block",
  Checkbox = "checkbox",
  Input = "input",
  Integration = "integration",
  Link = "link",
  Map = "map",
  Preset = "preset",
  Radio = "radio",
  Select = "select",
  Subtitle = "subtitle",
  Table = "table",
  Textarea = "textarea",
  Title = "title",
  Upload = "upload",
}

export type IFieldOptionsType =
  | ArrayOptions
  | BlockOptions
  | CheckboxOptions
  | InputOptions
  | IntegrationOptions
  | LinkOptions
  | MapOptions
  | PresetOptions
  | RadioOptions
  | SelectOptions
  | SubtitleOptions
  | TableOptions
  | TextAreaOptions
  | TitleOptions
  | UploadOptions;

const FieldOptionsTypeDict = {
  [FieldTypeEnum.Array]: ArrayOptions,
  [FieldTypeEnum.Block]: BlockOptions,
  [FieldTypeEnum.Checkbox]: CheckboxOptions,
  [FieldTypeEnum.Input]: InputOptions,
  [FieldTypeEnum.Integration]: IntegrationOptions,
  [FieldTypeEnum.Link]: LinkOptions,
  [FieldTypeEnum.Map]: MapOptions,
  [FieldTypeEnum.Preset]: PresetOptions,
  [FieldTypeEnum.Radio]: RadioOptions,
  [FieldTypeEnum.Select]: SelectOptions,
  [FieldTypeEnum.Subtitle]: SubtitleOptions,
  [FieldTypeEnum.Table]: TableOptions,
  [FieldTypeEnum.Textarea]: TextAreaOptions,
  [FieldTypeEnum.Title]: TitleOptions,
  [FieldTypeEnum.Upload]: UploadOptions,
};

export function getOptionsClass(type: FieldTypeEnum): any {
  return FieldOptionsTypeDict[type];
}

export class IFieldExpressions {
  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  visible?: string;

  @IsString()
  @IsOptional()
  valid?: string;

  @IsString()
  @IsOptional()
  integration?: string;

  @IsString()
  @IsOptional()
  options?: string;

  @IsString()
  @IsOptional()
  log?: string;
}

export class IField {
  @IsNotEmpty()
  @IsEnum(FieldTypeEnum)
  type!: FieldTypeEnum;

  @ValidateIf((obj) => {
    const specifiedValues = [FieldTypeEnum.Title, FieldTypeEnum.Subtitle];
    return !specifiedValues.includes(obj.type);
  })
  @IsString()
  key!: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type((data: any) => getOptionsClass(data.object.type))
  options!: IFieldOptionsType;

  @ValidateNested({ each: true })
  @Type(() => IFieldExpressions)
  expressions!: IFieldExpressions;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IField)
  block?: IField[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IField)
  preset?: IField[];
}

import { Type } from "class-transformer";
import {
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
  IsObject,
} from "class-validator";
import { JSONSchema7 } from "json-schema";
import { IField, ToBoolean } from ".";

/**
 * Enum representing privacy levels for response DTOs.
 */

export enum PrivacyLevelEnum {
  /**
   * Non-sensitive data intended for unrestricted public access.
   * Example: Public announcements, contact information for city services.
   */
  PUBLIC = 0,

  /**
   * Data accessible only to authenticated users.
   * Example: Personal dashboard, tax status, or application progress.
   */
  REGISTERED = 1,

  /**
   * Sensitive personal or identifiable information requiring special authorization.
   * Example: Service history, detailed complaint filings, or employee reviews.
   */
  RESTRICTED = 2,

  /**
   * Highly sensitive data with strict access controls.
   * Example: Medical records, financial data, or law enforcement reports.
   */
  CONFIDENTIAL = 3,

  /**
   * Data stripped of personal identifiers for privacy compliance.
   * Example: Anonymized health statistics or service utilization reports.
   */
  ANONYMIZED = 4,
}

export class BaseOptions {
  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  required?: boolean;

  @IsOptional()
  @IsEnum(PrivacyLevelEnum)
  accessLevel?: PrivacyLevelEnum;

  @IsOptional()
  @IsString()
  documentation?: string;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  enableEdition?: boolean;

  // experimental
  $refs?: IField[]; // List of fields that use this field in their expressions
  $ownRefs?: IField[]; // List of fields that this field uses in its expressions
}

export class FieldInputOptions extends BaseOptions {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  readOnly?: boolean;

  @IsOptional()
  @IsString()
  tooltip?: string;

  @IsOptional()
  @IsObject()
  schema?: JSONSchema7;

  @IsOptional()
  @IsBoolean()
  plugins?: { [namespace: string]: any };
}

export class FieldGroupOptions extends BaseOptions {
  @IsOptional()
  @IsString()
  tooltip?: string;
}

export class FieldRuleOptions extends BaseOptions {
  @IsOptional()
  @IsObject()
  schema?: JSONSchema7;
}

// Structure Fields
export class TitleOptions extends BaseOptions {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  tooltip?: string;
}

export class SubtitleOptions extends BaseOptions {
  @IsNotEmpty()
  @IsString()
  html: string;

  @IsOptional()
  @IsString()
  tooltip?: string;
}

// Input Fields
export class InputOptions extends FieldInputOptions {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  mask?: string;

  @IsOptional()
  @IsNumber()
  decimalScale?: number;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  autoFocus?: boolean;
}

export class TextAreaOptions extends FieldInputOptions {
  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  autoFocus?: boolean;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  code?: boolean;
}

export class SelectOptions extends FieldInputOptions {
  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Item)
  items?: Item[];
}

export class RadioOptions extends FieldInputOptions {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Item)
  items?: Item[];
}

export class CheckboxOptions extends FieldInputOptions {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Item)
  items?: Item[];
}

export class UploadOptions extends FieldInputOptions {
  @IsOptional()
  @IsString()
  dir?: string;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  multiple?: boolean;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  gallery?: boolean;

  @IsOptional()
  @IsNumber()
  maxSize?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedExtensions?: string[];
}

export class MapOptions extends FieldInputOptions {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Layer)
  layers?: Layer[];

  @IsOptional()
  @IsString()
  height?: string;

  @IsOptional()
  @IsString()
  width?: string;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  table?: boolean;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  zoomControl?: boolean;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  hideHeader?: boolean;

  @IsOptional()
  @IsString()
  source?: string;
}

// Group
export class PresetOptions extends FieldGroupOptions {
  @IsOptional()
  @IsString()
  key?: string;
}

export class BlockOptions extends FieldGroupOptions {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  card?: boolean;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  open?: boolean;

  @IsOptional()
  @IsEnum(["step", "block"])
  layout?: "step" | "block";

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  toggle?: boolean;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  hideEditMenu?: boolean;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  hideCardBorder?: boolean;
}

// Group
export class ArrayOptions extends FieldGroupOptions {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  readOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  hideHeader?: boolean;

  @IsOptional()
  @IsNumber()
  columns?: number;

  @IsOptional()
  @IsEnum(["table"])
  layout?: "table";

  @IsOptional()
  @IsString()
  width?: string;
}

export class TableOptions extends FieldGroupOptions {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  readOnly?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  columns?: number;

  @IsOptional()
  @IsString()
  width?: string;

  @IsNotEmpty()
  table: IField[][];
}

// Logic
export class LinkOptions extends FieldRuleOptions {}

export class IntegrationOptions extends FieldRuleOptions {
  @IsOptional()
  @IsBoolean()
  @ToBoolean()
  log?: boolean;
}

// utils
class Item {
  @IsNotEmpty()
  @IsString()
  label: string;

  @IsNotEmpty()
  value: any;
}

class Layer {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LayerProperty)
  properties: LayerProperty[];

  @IsNotEmpty()
  @IsString()
  color: string;

  @IsNotEmpty()
  @IsString()
  key: string;
}

class LayerProperty {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsString()
  label: string;

  @IsNotEmpty()
  @IsBoolean()
  includeOnPopUp: boolean;
}

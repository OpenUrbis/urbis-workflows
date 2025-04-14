import { IFieldOptionsType, IField, IFormContext } from "@open-urbis/types";

export type FieldProps = {
  parent?: IField;
  context: any;
  validContext: any;
  general: IFormContext;
  field: IField;
  value: any;
  valid: any;
  onChange: (value: any) => void;
  onValidChange: (valid: any) => void;
};

export type FieldBlockProps = {
  parent: IField;
  layout?: "step" | "block" | "table";
  field: IField[];
  general: IFormContext;
  value: any;
  valid: any;
  onChange: (key: string, value: any) => void;
  onValidChange: (key: string, valid: boolean) => void;
};

export type FieldBlockEditableProps = {
  parent: IField;
  layout?: "step" | "block" | "table";
  field: IField[];
  general: IFormContext;
  value: any;
  valid: any;
  onChange: (key: string, value: any) => void;
  onValidChange: (key: string, valid: boolean) => void;
  onConfigChange: (field: IField[]) => void;
  onParentConfigChange: (field: IField) => void;
  onRemove: (index: number) => void;
};

export type FieldBase = {
  key: string;
  options: IFieldOptionsType;
  onChange: (value: any) => void;
  onValidChange: (valid: any) => void;
  general: IFormContext;
  value: any;
  valid: any;
  context: any;
  field: IField;
};

export interface FunctionDefinitions {
  [domain: string]: {
    [namespace: string]: string;
  };
}
export interface ParsedFunctions {
  [namespace: string]: {
    [functionName: string]: Function;
  };
}
export type FieldBlockViewProps = {
  field: IField[];
  general: IFormContext;
  value: any;
};

export type FieldEditableProps = {
  parent?: IField;
  context: any;
  validContext: any;
  general: IFormContext;
  field: IField;
  value: any;
  valid: any;
  onChange: (value: any) => void;
  onValidChange: (valid: any) => void;
  onConfigChange: (config: IField) => void;
  onRemove: () => void;
};

export const InputFieldTypes = [
  "checkbox",
  "input",
  "map",
  "radio",
  "select",
  "textarea",
  "upload",
  "table",
];

export const InlineEditableTypes = [
  "title",
  "subtitle",
  "description",
  "paragraph",
  "link",
  "integration",
];

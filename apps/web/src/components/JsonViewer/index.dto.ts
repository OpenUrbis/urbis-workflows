export type onEditFn = (value: any, path: string[]) => void;

export interface IJsonViewerProps {
  data: any;
  level?: number;
  levelOpen?: number;
  keyName?: string;

  path?: string[];

  onEdit?: onEditFn;
}

export interface IJsonViewerItem {
  dataType: DataTypeEnum;
  childrenKeys?: any;
  hasChildren?: boolean;
  value?: any;

  onEdit?: onEditFn;
}

export enum DataTypeEnum {
  ARRAY = "array",
  OBJECT = "object",
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  NULL = "null",
}

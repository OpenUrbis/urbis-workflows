import { IField } from "@open-urbis/types";

export enum FormTypeEnum {
  FIELD = "field",
  BLOCK = "block",
  STEP = "step",
}

export interface FormMetadata {
  id: string;
  label: string;
  documentation: string;
  namespace: string;
  type: FormTypeEnum;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  commit: string;
}

export interface FormVersionMetadata {
  id: string;
  label: string;
  documentation: string;
  namespace: string;
  type: FormTypeEnum;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  commit: string;
  version: number;
}

export interface FormData extends FormMetadata {
  form: IField;
  updatedBy?: {
    id: string;
    name: string;
    email: string;
  };
  updatedAt?: Date;
}

export interface FormVersionData extends FormVersionMetadata {
  form: IField;
}

export interface CreateFormDto {
  label: string;
  namespace: string;
  documentation: string;
  type: FormTypeEnum;
  form: IField;
  commit: string;
}

export interface UpdateFormDto {
  label: string;
  namespace: string;
  documentation: string;
  type: FormTypeEnum;
  form: IField;
  commit: string;
} 
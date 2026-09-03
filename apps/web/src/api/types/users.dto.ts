import { IField } from "@open-urbis/types";

// Base Types
export interface UserData {
  id: string;
  name: string;
  document: string;
  custom: any;
  createdAt: string;
  updatedAt: string;
  roles: string[];
  permissions: string[];
}

export interface Field {
  type: string;
  label: string;
  required?: boolean;
  options?: any;
  [key: string]: any;
}

// Request DTOs
export interface UpdateProfileHttpDto {
  name?: string;
  custom?: any;
}

export interface SetCustomUserFieldsHttpDto {
  config: IField;
}

export interface CreateLinkHttpDto {
  represented: string;
  link: string;
  representative: string;
}

export interface UpdateLinkStatusHttpDto {
  represented: string;
  representative: string;
  link: string;
  newStatus: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";
}

export interface DeleteLinkHttpDto {
  represented: string;
  link: string;
  representative: string;
}

// Response DTOs
export interface UserResponse {
  id: string;
  email: string;
  document: string;
  name: string;
  custom: any;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileResponse extends UserResponse {
  roles: string[];
  permissions: string[];
}

export interface CustomFieldsResponse {
  config: IField;
}

export interface RepresentativeLink {
  id: string;
  link: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";
  timestamp: string;
  updatedAt: string;
  representative: string;
  represented: string;
}

export interface RepresentativeLinksResponse {
  links: RepresentativeLink[];
}

export interface UserApiResponse {
  id: string;
  document: string;
  name: string;
  custom: any;
}

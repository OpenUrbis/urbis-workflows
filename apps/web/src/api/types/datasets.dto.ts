// Base entity type
export interface DatasetsEntity {
  id: string;
  title: string;
  description: string;
  link: string[];
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  updatedAt: string;
  updatedBy: {
    id: string;
    name: string;
  };
}

// Request DTOs
export interface CreateDatasetHttpDto {
  title: string;
  description: string;
  link: string[];
}

export interface UpdateDatasetHttpDto extends CreateDatasetHttpDto {}

export interface GeneratePresignedUrlHttpDto {
  dirName?: string;
  fileName: string;
  fileType: string;
}

export interface GenerateDownloadUrlHttpDto {
  dirName?: string;
  fileName: string;
}

export interface CreateTableHttpDto {
  id: string;
}

export interface QueryTableHttpDto {
  fileName: string;
  filters: { [key: string]: string };
}

// Response DTOs
export interface FindOneResponse extends DatasetsEntity {
  inserted: number;
  total: number;
  sample: any[];
}

export interface GeneratePresignedUrlResponse {
  url: string;
}

export interface GenerateDownloadUrlResponse {
  url: string;
}

export interface CreateTableHttpResponse {
  message: string;
}

export interface QueryTableResponse {
  data: any[];
} 
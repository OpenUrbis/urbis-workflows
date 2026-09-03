export interface UserData {
  id: string;
  name: string;
  email: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

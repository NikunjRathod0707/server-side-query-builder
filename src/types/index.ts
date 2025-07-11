export interface Request {
  query: {
    filterModel?: string;
    sortModel?: string;
    paginationModel?: string;
  };
}

export interface FilterItem {
  field: string;
  operator: string;
  value?: any;
}

export interface FilterModel {
  items?: FilterItem[];
}

export interface SortModel {
  field: string;
  sort: 'asc' | 'desc';
}

export interface PaginationModel {
  page: number;
  pageSize: number;
}

export interface QueryFunctionParams {
  where: string;
  order: string;
  params: any[];
  limit: number;
  offset: number;
}

export interface QueryResult {
  status: boolean;
  data: any[];
}

export interface CountFunctionParams {
  where: string;
  params: any[];
}

export interface SSRDataModuleParams {
  req: Request;
  queryFn: (params: QueryFunctionParams) => Promise<QueryResult>;
  countFn: (params: CountFunctionParams) => Promise<number | null>;
  fieldMap: Record<string, string>;
  transformFn?: (row: any) => any;
}

export interface SSRDataModuleResult {
  status: boolean;
  data?: any[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  message?: string;
}

export interface BuildFiltersParams {
  filterModel: FilterModel;
  sortModel: SortModel[];
  fieldMap: Record<string, string>;
}

export interface BuildFiltersResult {
  where: string;
  order: string;
  params: any[];
}

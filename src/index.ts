import {
    Request,
    FilterModel,
    SortModel,
    PaginationModel,
    SSRDataModuleParams,
    SSRDataModuleResult,
    BuildFiltersParams,
    BuildFiltersResult
  } from './types';
  
  export const getSSRDataModule = async ({
    req,
    queryFn,
    countFn,
    fieldMap,
    transformFn = (row: any) => row,
  }: SSRDataModuleParams): Promise<SSRDataModuleResult> => {
    try {
      const filterModelRaw = req.query.filterModel;
      const sortModelRaw = req.query.sortModel;
      const paginationModelRaw = req.query.paginationModel;
  
      let filterModel: FilterModel = {};
      let sortModel: SortModel[] = [];
      let paginationModel: PaginationModel = { page: 0, pageSize: 10 };
  
      try {
        if (typeof filterModelRaw === 'string') {
          filterModel = JSON.parse(filterModelRaw);
        }
      } catch {
        console.warn('Invalid filterModel JSON, using default {}');
      }
  
      try {
        if (typeof sortModelRaw === 'string') {
          sortModel = JSON.parse(sortModelRaw);
        }
      } catch {
        console.warn('Invalid sortModel JSON, using default []');
      }
  
      try {
        if (typeof paginationModelRaw === 'string') {
          paginationModel = JSON.parse(paginationModelRaw);
        }
      } catch {
        console.warn('Invalid paginationModel JSON, using default { page: 0, pageSize: 10 }');
      }
  
      const page = parseInt(paginationModel?.page?.toString() ?? '0');
      const pageSize = parseInt(paginationModel?.pageSize?.toString() ?? '10');
      const offset = page * pageSize;
  
      const { where, order, params } = buildFilters({ filterModel, sortModel, fieldMap });
  
      const rowsResult = await queryFn({ where, order, params, limit: pageSize, offset });
      if (!rowsResult?.status) throw new Error('Query function failed');
  
      const countResult = await countFn({ where, params });
      const totalCount = typeof countResult === 'number' ? countResult : 0;
  
      const rawData = Array.isArray(rowsResult.data) ? rowsResult.data : [];
      const transformed = rawData.map(transformFn);
  
      return {
        status: true,
        data: transformed,
        totalCount,
        page,
        pageSize
      };
    } catch (err) {
      console.error('SSR Fetch Error:', err);
      return {
        status: false,
        message: 'Error retrieving data',
      };
    }
  };
  
  export const buildFilters = ({
    filterModel,
    sortModel,
    fieldMap
  }: BuildFiltersParams): BuildFiltersResult => {
    const whereParts: string[] = [];
    const params: any[] = [];
    const items = filterModel?.items || [];
  
    for (const item of items) {
      const column = fieldMap[item.field];
      if (!column) continue;
  
      const val = item.value;
      const op = item.operator;
  
      switch (op) {
        case 'contains':
          whereParts.push(`${column} LIKE ?`);
          params.push(`%${val}%`);
          break;
        case 'does not contain':
          whereParts.push(`${column} NOT LIKE ?`);
          params.push(`%${val}%`);
          break;
        case 'startsWith':
          whereParts.push(`${column} LIKE ?`);
          params.push(`${val}%`);
          break;
        case 'endsWith':
          whereParts.push(`${column} LIKE ?`);
          params.push(`%${val}`);
          break;
        case 'equals':
          whereParts.push(`${column} = ?`);
          params.push(val);
          break;
        case 'does not equal':
          whereParts.push(`${column} != ?`);
          params.push(val);
          break;
        case 'is any of':
          if (Array.isArray(val) && val.length > 0) {
            const placeholders = val.map(() => '?').join(', ');
            whereParts.push(`${column} IN (${placeholders})`);
            params.push(...val);
          }
          break;
        case 'is empty':
          whereParts.push(`(${column} IS NULL OR ${column} = '')`);
          break;
        case 'is not empty':
          whereParts.push(`(${column} IS NOT NULL AND ${column} != '')`);
          break;
        case '=':
        case '!=':
        case '>':
        case '>=':
        case '<':
        case '<=':
          whereParts.push(`${column} ${op} ?`);
          params.push(val);
          break;
        case 'is':
          whereParts.push(`DATE(${column}) = DATE(?)`);
          params.push(val.split('T')[0]);
          break;
        case 'is not':
          whereParts.push(`DATE(${column}) != DATE(?)`);
          params.push(val.split('T')[0]);
          break;
        case 'is after':
          whereParts.push(`${column} > ?`);
          params.push(val);
          break;
        case 'is on or after':
          whereParts.push(`${column} >= ?`);
          params.push(val);
          break;
        case 'is before':
          whereParts.push(`${column} < ?`);
          params.push(val);
          break;
        case 'is on or before':
          whereParts.push(`${column} <= ?`);
          params.push(val);
          break;
        default:
          break;
      }
    }
  
    const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
  
    const orderByClauses = sortModel
    .map(({ field, sort }: SortModel) => {
      const column = fieldMap?.[field];
      if (!column || !['asc', 'desc'].includes(sort?.toLowerCase())) return null;
      return `${column} ${sort.toUpperCase()}`;
    })
    .filter(Boolean) as string[];
  
  
    const order = orderByClauses.length ? 'ORDER BY ' + orderByClauses.join(', ') : '';
  
    return { where, order, params };
  };
  
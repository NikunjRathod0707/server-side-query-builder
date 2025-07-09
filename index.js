/**
 * Universal paginated, filtered, and sorted query builder with built-in filter builder
 */

const getSSRDataModule = async ({
  req,
  queryFn,
  countFn,
  fieldMap,
  transformFn = (row) => row,
}) => {
  try {
    const { filterModel, sortModel, paginationModel } = req.query;

    const { where, order, params } = buildFilters({
      filterModel: JSON.parse(filterModel || '{}'),
      sortModel: JSON.parse(sortModel || '[]'),
      fieldMap,
    });

    const pageSize = parseInt(paginationModel?.pageSize ?? 10);
    const page = parseInt(paginationModel?.page ?? 0);
    const offset = page * pageSize;

    const rowsResult = await queryFn({ where, order, params, limit: pageSize, offset });
    if (!rowsResult?.status) throw new Error('Data fetch failed');

    const countResult = await countFn({ where, params });
    const totalCount = typeof countResult === 'number' ? countResult : 0;

    const transformed = rowsResult.data.map(transformFn);

    return {
      status: true,
      data: transformed,
      totalCount,
    };
  } catch (err) {
    console.error("SSR Fetch Error:", err);
    return {
      status: false,
      message: 'Error retrieving data',
    };
  }
};

/**
 * Converts filterModel and sortModel to SQL where/order and params
 */
const buildFilters = ({ filterModel, sortModel, fieldMap }) => {
  const conditions = [];
  const params = [];

  const items = filterModel?.items || [];

  for (const item of items) {
    const column = fieldMap[item.field];
    if (!column) continue;

    switch (item.operator) {
      case 'contains':
        conditions.push(`${column} LIKE ?`);
        params.push(`%${item.value}%`);
        break;
      case 'equals':
        conditions.push(`${column} = ?`);
        params.push(item.value);
        break;
      case 'startsWith':
        conditions.push(`${column} LIKE ?`);
        params.push(`${item.value}%`);
        break;
      case 'endsWith':
        conditions.push(`${column} LIKE ?`);
        params.push(`%${item.value}`);
        break;
      case 'isEmpty':
        conditions.push(`(${column} IS NULL OR ${column} = '')`);
        break;
      case 'isNotEmpty':
        conditions.push(`(${column} IS NOT NULL AND ${column} != '')`);
        break;
      default:
        break;
    }
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const order =
    Array.isArray(sortModel) && sortModel.length
      ? 'ORDER BY ' +
        sortModel
          .map((sort) => `${fieldMap[sort.field] || sort.field} ${sort.sort.toUpperCase()}`)
          .join(', ')
      : '';

  return { where, order, params };
};

module.exports = { getSSRDataModule };

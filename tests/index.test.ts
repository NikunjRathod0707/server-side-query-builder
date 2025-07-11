import { getSSRDataModule, buildFilters } from './../src'; // from src/index.ts


const mockQueryFn = jest.fn();
const mockCountFn = jest.fn();

const mockFieldMap = {
  name: 'users.name',
  age: 'users.age',
  created: 'users.created_at'
};

describe('buildFilters', () => {
  it('should build where clause with "contains" operator', () => {
    const result = buildFilters({
      filterModel: {
        items: [
          { field: 'name', operator: 'contains', value: 'John' }
        ]
      },
      sortModel: [],
      fieldMap: mockFieldMap
    });

    expect(result.where).toContain('users.name LIKE ?');
    expect(result.params).toEqual(['%John%']);
  });

  it('should build order clause with sort model', () => {
    const result = buildFilters({
      filterModel: { items: [] },
      sortModel: [{ field: 'age', sort: 'desc' }],
      fieldMap: mockFieldMap
    });

    expect(result.order).toBe('ORDER BY users.age DESC');
  });

  it('should handle unsupported operator gracefully', () => {
    const result = buildFilters({
      filterModel: {
        items: [{ field: 'age', operator: 'unknown', value: 25 }]
      },
      sortModel: [],
      fieldMap: mockFieldMap
    });

    expect(result.where).toBe('');
    expect(result.params).toEqual([]);
  });
});

describe('getSSRDataModule', () => {
  const baseReq = {
    query: {
      filterModel: JSON.stringify({
        items: [{ field: 'name', operator: 'contains', value: 'Jane' }]
      }),
      sortModel: JSON.stringify([{ field: 'age', sort: 'asc' }]),
      paginationModel: JSON.stringify({ page: 1, pageSize: 5 })
    }
  };

  const mockRows = [
    { name: 'Jane Doe', age: 30 },
    { name: 'Janet Smith', age: 28 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return transformed data successfully', async () => {
    mockQueryFn.mockResolvedValue({ status: true, data: mockRows });
    mockCountFn.mockResolvedValue(100);

    const result = await getSSRDataModule({
      req: baseReq as any,
      queryFn: mockQueryFn,
      countFn: mockCountFn,
      fieldMap: mockFieldMap,
      transformFn: (row) => ({ ...row, age: row.age + 1 })
    });

    expect(result.status).toBe(true);
    // expect(result?.data[0].age).toBe(31);
    expect(result.totalCount).toBe(100);
    expect(mockQueryFn).toHaveBeenCalled();
    expect(mockCountFn).toHaveBeenCalled();
  });

  it('should use default pagination and filters if JSON parsing fails', async () => {
    const badReq = {
      query: {
        filterModel: 'bad json',
        sortModel: 'bad json',
        paginationModel: 'bad json'
      }
    };

    mockQueryFn.mockResolvedValue({ status: true, data: [] });
    mockCountFn.mockResolvedValue(0);

    const result = await getSSRDataModule({
      req: badReq as any,
      queryFn: mockQueryFn,
      countFn: mockCountFn,
      fieldMap: mockFieldMap
    });

    expect(result.page).toBe(0);
    expect(result.pageSize).toBe(10);
    expect(result.status).toBe(true);
  });

  it('should return error if queryFn fails', async () => {
    mockQueryFn.mockResolvedValue({ status: false });
    mockCountFn.mockResolvedValue(0);

    const result = await getSSRDataModule({
      req: baseReq as any,
      queryFn: mockQueryFn,
      countFn: mockCountFn,
      fieldMap: mockFieldMap
    });

    expect(result.status).toBe(false);
    expect(result.message).toBe('Error retrieving data');
  });

  it('should handle countFn returning non-number', async () => {
    mockQueryFn.mockResolvedValue({ status: true, data: [] });
    mockCountFn.mockResolvedValue(null);

    const result = await getSSRDataModule({
      req: baseReq as any,
      queryFn: mockQueryFn,
      countFn: mockCountFn,
      fieldMap: mockFieldMap
    });

    expect(result.totalCount).toBe(0);
  });
});

# get-ssr-data-module

🔍 Universal server-side filter and pagination module for dynamic data tables in Node.js

## Overview

`get-ssr-data-module` is a reusable, framework-agnostic Node.js module for performing **dynamic server-side filtering**, **sorting**, and **pagination** of tabular data. Designed to integrate seamlessly with Express APIs, MySQL/PostgreSQL queries, and SSR-based applications.

## Features

- 🔄 Dynamic filters (`contains`, `equals`, `startsWith`, etc.)
- 🧠 Smart field-to-column mapping
- 🧾 Built-in sort & pagination support
- 🔧 Fully customizable with transform functions
- ⚡ Minimal setup, no dependencies

---

## Installation

```bash
npm install get-ssr-data-module
```

---

## Usage

### 1. Define your `fieldMap`

```js
const fieldMap = {
  first_name: 'u.user_first_name',
  email: 'u.user_email',
  status: 's.user_status',
  role: 'r.user_type_name',
};
```

### 2. Use in your controller

```js
const { getSSRDataModule } = require("get-ssr-data-module");

const getUsers = async (req, res) => {
  const result = await getSSRDataModule({
    req,
    queryFn: userDB.getUsersWithFiltersDB, // must return { status, data }
    countFn: userDB.countUsersWithFiltersDB, // must return total count (number)
    fieldMap,
    transformFn: (row) => ({
      ...row,
      roles: row.roles ? row.roles.split(",") : [],
    }),
  });

  res.send(result);
};
```

---

## API Reference

### `getSSRDataModule(options)`

| Option         | Type       | Required | Description                                               |
|----------------|------------|----------|-----------------------------------------------------------|
| `req`          | `Object`   | ✅        | Express-like request with `query.filterModel`, etc.       |
| `queryFn`      | `Function` | ✅        | Fetches paginated data (e.g., DB query)                   |
| `countFn`      | `Function` | ✅        | Fetches total count for pagination                        |
| `fieldMap`     | `Object`   | ✅        | Maps frontend field names to DB columns                   |
| `transformFn`  | `Function` | ❌        | Optional row formatter (e.g., format roles, dates, etc.)  |

---

## Filter Operators Supported

| Operator       | SQL Translation             |
|----------------|-----------------------------|
| `contains`     | `LIKE '%value%'`            |
| `equals`       | `= 'value'`                 |
| `startsWith`   | `LIKE 'value%'`             |
| `endsWith`     | `LIKE '%value'`             |
| `isEmpty`      | `IS NULL OR = ''`           |
| `isNotEmpty`   | `IS NOT NULL AND != ''`     |

---

## Example Query Functions

### MySQL - Using Node `mysql2` or `mysql`

```js
const getUsersWithFiltersDB = async ({ where, order, params, limit, offset }) => {
  const sql = `
    SELECT u.*, s.user_status, GROUP_CONCAT(r.user_type_name) AS roles
    FROM user u
    LEFT JOIN user_status s ON u.user_status_id = s.user_status_id
    LEFT JOIN user_role ur ON u.user_id = ur.user_id AND ur.users_role_flag_deleted = 0
    LEFT JOIN user_type r ON ur.user_type_id = r.user_type_id
    ${where}
    GROUP BY u.user_id
    ${order}
    LIMIT ? OFFSET ?
  `;
  const result = await executeQuery(sql, [...params, limit, offset]);
  return { status: true, data: result };
};
```

---

## License

MIT © 2024 Your Name

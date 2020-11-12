# postgres-query-builder

Simple query builder for select statements in postgresql.

Returns the rows. (Promise object)

There is no error handling (yet).

# example usage

```
const PostgresQueryBuilder = require('postgres-query-builder');
const query = new PostgresQueryBuilder({
    user: <username>,
    host: <host>,
    database: <dbname>,
    password: <password>,
    port: 5432,
})

query.fetch('user', {where: {id: '> 5', name: '= Joe'}}).then(result=>
    doSomething()...
)

```

# examples
```
query.fetch('user')
//SELECT * FROM user
query.fetch({from: 'user'})
//SELECT * FROM user
query.fetch({select: ['id', 'name'], from: 'user',})
//SELECT id, name FROM user
query.fetch('user', {where: {id: '> 5', name: '= Joe'}})
// SELECT * FROM user WHERE id > $1 AND name = $2
query.fetch('user', {where: {id: '> 5', name: '= Joe'}, orderBy: 'name', groupBy: ['name, city']})
// SELECT * FROM user WHERE id > $1 AND name = $2 ORDER BY name GROUP BY name, city
query.fetch({from: 'user', where: {id: '> 5', name: '= Joe'}, orderBy: ['name']})
// SELECT * FROM user WHERE id > $1 AND name = $2 ORDER BY name
```
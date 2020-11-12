class QueryBuilder {
    constructor(options) {
        const pool = new (require('pg').Pool)(options);
        this.query = require('util').promisify(pool.query).bind(pool);
        this.promisePoolEnd = require('util').promisify(pool.end).bind(pool);
        process.on('SIGINT', () => {
            this.promisePoolEnd();
            process.exit()
        });
    }

    fetch = async (tableName, options) => {
        let result;
        if (typeof options === 'undefined' && typeof tableName === 'string') result = await query(`SELECT * FROM ${tableName}`)
        else {
            if (typeof tableName === 'object') options = tableName
            const table = (options.table) ? options.table : tableName
            const columns = (options.columns) ? options.columns.join(', ') : '*'
            let conditions = '';
            if (options.conditions) {
                conditions = 'WHERE '
                for (const [index, condition] of Object.keys(options.conditions).entries()) {
                    console.log(condition)
                    const operator = options.conditions[condition].split(' ')[0]
                    conditions += `${condition} ${operator} $${index + 1}`
                    if (index < Object.keys(options.conditions).length - 1) conditions += ' AND '
                }
            }
            const orderBy = (options.order) ? ((typeof options.order === 'string') ? `ORDER BY ${options.order}` : `ORDER BY ${options.order.join(', ')}`) : ''
            const groupBy = (options.group) ? ((typeof options.group === 'string') ? `GROUP BY ${options.group}` : `GROUP BY ${options.group.join(', ')}`) : ''
            const limit = (options.limit) ? `LIMIT ${options.limit}` : ''
            result = await this.query(`SELECT ${columns} FROM ${table} ${conditions} ${orderBy} ${groupBy} ${limit}`,
                (options.conditions) ? Object.values(options.conditions).map(condition => condition.split(' ')[1]) : [])
        }

        return result.rows;
    }


}

module.exports = QueryBuilder


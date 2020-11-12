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
            const table = (options.from) ? options.from : tableName
            const columns = (options.select) ? options.select.join(', ') : '*'
            let conditions = '';
            if (options.where) {
                conditions = 'WHERE '
                for (const [index, condition] of Object.keys(options.where).entries()) {
                    const operator = options.where[condition].split(' ')[0]
                    conditions += `${condition} ${operator} $${index + 1}`
                    if (index < Object.keys(options.where).length - 1) conditions += ' AND '
                }
            }
            const orderBy = (options.orderBy) ? ((typeof options.orderBy === 'string') ? `ORDER BY ${options.orderBy}` : `ORDER BY ${options.orderBy.join(', ')}`) : ''
            const groupBy = (options.groupBy) ? ((typeof options.groupBy === 'string') ? `GROUP BY ${options.groupBy}` : `GROUP BY ${options.groupBy.join(', ')}`) : ''
            const limit = (options.limit) ? `LIMIT ${options.limit}` : ''
            // console.log(`SELECT ${columns} FROM ${table} ${conditions} ${orderBy} ${groupBy} ${limit}`)
            result = await this.query(`SELECT ${columns} FROM ${table} ${conditions} ${orderBy} ${groupBy} ${limit}`,
                (options.where) ? Object.values(options.where).map(condition => condition.split(' ')[1]) : [])
        }

        return result.rows;
    }


}

module.exports = QueryBuilder


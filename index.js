class QueryBuilder {
    constructor(options) {
        const pool = new (require('pg').Pool)(options);
        this.query = require('util').promisify(pool.query).bind(pool);
        this.promisePoolEnd = require('util').promisify(pool.end).bind(pool);
        process.on('beforeExit', () => {
            this.promisePoolEnd();
        });
        this.getResult = async (queryString, queryParameters) => {
            try {
                const result = await this.query(queryString, queryParameters)
                return result.rows
            } catch (e) {
                throw new Error(e)
            }
        }
        this.processOptions = (options, tableName) => {
            const fromClause = this.getFromClause(tableName, options);
            const selectClause = this.getSelectClause(options.select);
            const whereResult = this.getWhereClause(options.where)
            const whereClause = whereResult.str;
            const parameters = whereResult.parameters;
            const orderByClause = this.getOrderByClause(options.orderBy)
            const groupByClause = this.getGroupByClause(options.groupBy)
            const limitClause = this.getLimitClause(options.limit)
            return {
                queryString: `SELECT ${selectClause} FROM ${fromClause} ${whereClause} ${groupByClause} ${orderByClause} ${limitClause}`,
                queryParameters: parameters,
                onlyQueryString: options.onlyQueryString,
            }
        }
        this.getFromClause = (tableName, options) => {
            const result = (tableName) ? tableName : options.from
            if (typeof result === 'undefined') throw new Error('Table name is missing.')
            return result;
        }
        this.getSelectClause = columns => {
            switch (typeof columns) {
                case "undefined":
                    return '*';
                case "string":
                    return columns;
                case "object":
                    try {
                        return columns.join(', ');
                    } catch {
                        throw new Error(`Bad select format at: ${columns}`);
                    }
                default:
                    throw new Error(`Expected ${columns} to be string or object or undefined, instead got ${typeof columns}`)
            }
        }
        this.getWhereClause = conditions => {
            let result = {str: '', parameters: []}
            if (typeof conditions === "undefined") return result
            result.str = 'WHERE ';
            try {
                for (const [index, condition] of Object.keys(conditions).entries()) {
                    const cond = conditions[condition].split(' ');
                    const operator = cond.shift()
                    result.str += `${condition} ${operator} $${index + 1}`
                    if (index < Object.keys(conditions).length - 1) result.str += ' AND '
                    result.parameters.push(cond.join(''))
                }
                return result;
            } catch {
                throw new Error(`Bad WHERE format at ${conditions}`)
            }
        }
        this.getOrderByClause = orderBy => {
            switch (typeof orderBy) {
                case "undefined":
                    return ''
                case "string":
                    return `ORDER BY ${orderBy}`
                case "object":
                    try {
                        return `ORDER BY ${orderBy.join(', ')}`
                    } catch {
                        throw new Error(`Bad orderBy format at: ${orderBy}`)
                    }
                default:
                    throw new Error(`Expected ${orderBy} to be string or object or undefined, instead got ${typeof orderBy}`)
            }
        }
        this.getGroupByClause = groupBy => {
            switch (typeof groupBy) {
                case "undefined":
                    return ''
                case "string":
                    return `GROUP BY ${groupBy}`
                case "object":
                    try {
                        return `GROUP BY ${groupBy.join(', ')}`
                    } catch {
                        throw new Error(`Bad groupBy format at: ${groupBy}`)
                    }
                default:
                    throw new Error(`Expected ${groupBy} to be string or object or undefined, instead got ${typeof groupBy}`)
            }
        }
        this.getLimitClause = limit => {
            switch (typeof limit) {
                case "undefined":
                    return ''
                case "string":
                    return `LIMIT ${limit}`
                case "number":
                    return `LIMIT ${limit}`
                default:
                    throw new Error(`Expected ${limit} to be string or number or undefined, instead got ${typeof limit}`)
            }
        }
    }

    fetch = async (tableName, options) => {
        let queryString,
            queryParameters = [],
            optionResults,
            onlyQueryString;
        switch (typeof tableName) {
            case "string":
                switch (typeof options) {
                    case "object":
                        optionResults = this.processOptions(options, tableName)
                        queryString = optionResults.queryString
                        queryParameters = optionResults.queryParameters
                        onlyQueryString = optionResults.onlyQueryString
                        break;
                    case "undefined":
                        queryString = `SELECT * FROM ${tableName}`;
                        break;
                    default:
                        throw new Error(`Expected ${options} to be object or undefined, instead got ${typeof options}`)
                }
                break;
            case "object":
                if (typeof options !== 'undefined') throw new Error(`Unexpected parameter`)
                optionResults = this.processOptions(tableName)
                queryString = optionResults.queryString
                queryParameters = optionResults.queryParameters
                onlyQueryString = optionResults.onlyQueryString
                break;
            default:
                throw new Error(`Expected ${tableName} to be string or object, instead got ${typeof tableName}`)
        }
        if (onlyQueryString)
            return queryString
        return this.getResult(queryString, queryParameters)
    }


}

module.exports = QueryBuilder


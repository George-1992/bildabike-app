import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

const Prisma =
    globalForPrisma.Prisma ||
    new PrismaClient({
        // log: ['query', 'error', 'warn'], // optional, for dev debugging
    })

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.Prisma = Prisma
}


export const applyFiltersToPrismaQuery = ({
    query = {},
    filters = []
}) => {
    try {
        if (!filters || filters.length === 0) return query;

        // if query is not an object, return as is
        if (typeof query !== 'object') return query;

        const where = query.where || {};

        // Group filters by key to handle multiple values for same field
        const filterGroups = {};
        
        for (const filter of filters) {
            const { key, operator, value } = filter;
            if (!key || !operator) continue;
            // skip if value is null/undefined/empty string
            if (value === null || value === undefined || value === '') continue;

            if (!filterGroups[key]) {
                filterGroups[key] = [];
            }
            filterGroups[key].push({ operator, value });
        }

        // Apply grouped filters
        for (const [key, filterGroup] of Object.entries(filterGroups)) {
            if (filterGroup.length === 1) {
                // Single filter for this key
                const { operator, value } = filterGroup[0];
                if (operator === 'equals') {
                    where[key] = value;
                } else if (operator === 'notEquals') {
                    where[key] = { not: value };
                }
            } else {
                // Multiple filters for same key - group by operator
                const equalValues = [];
                const notEqualValues = [];
                
                for (const { operator, value } of filterGroup) {
                    if (operator === 'equals') {
                        equalValues.push(value);
                    } else if (operator === 'notEquals') {
                        notEqualValues.push(value);
                    }
                }

                // Build the where condition
                const conditions = [];
                
                if (equalValues.length > 0) {
                    if (equalValues.length === 1) {
                        conditions.push({ [key]: equalValues[0] });
                    } else {
                        // Multiple equals values = OR condition
                        conditions.push({ [key]: { in: equalValues } });
                    }
                }
                
                if (notEqualValues.length > 0) {
                    if (notEqualValues.length === 1) {
                        conditions.push({ [key]: { not: notEqualValues[0] } });
                    } else {
                        // Multiple not equals values = AND condition (not in any of these)
                        conditions.push({ [key]: { notIn: notEqualValues } });
                    }
                }

                // If we have both equals and notEquals, combine with AND
                if (conditions.length === 1) {
                    Object.assign(where, conditions[0]);
                } else if (conditions.length > 1) {
                    if (!where.AND) where.AND = [];
                    where.AND.push(...conditions);
                }
            }
        }

        return { ...query, where: where };

    } catch (error) {
        console.error('Error applying filters to Prisma query: ', error);
        return query;
    }
}


export default Prisma


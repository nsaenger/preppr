import crypto from "node:crypto";
import {DateTime} from "luxon";

export const empty = (value: any) => {
    return value === "" || value === undefined || value === false || value === null;
};

export const HashPassword = (password: string, ts: DateTime): string => {
    const salt = ts.toString();
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

/**
 * Filters an array to include only distinct elements, removing duplicates.
 *
 * @param {T[]} value - The input array whose distinct elements are to be retrieved.
 * @return {T[]} A new array containing only the distinct elements from the input array.
 */
export function Distinct<T>(value: T[]): T[] {
    const distinctValue: T[] = [];
    value.map((v: T) => {
        if (!distinctValue.includes(v)) {
            distinctValue.push(v);
        }
    });
    return distinctValue;
}

/**
 * Creates a sorting function for an array of objects based on a specified key.
 *
 * @template T The type of the objects in the array.
 * @param {keyof T} key The key of the object to base the sorting on.
 *                      The key must have values of either type string or number.
 * @return {(a: T, b: T) => number} A comparator function to sort objects by the specified key.
 *                                  The comparator can be used in array sort operations.
 *                                  For numbers, it sorts in descending order.
 *                                  For strings, it sorts in ascending lexicographical order.
 * @throws {Error} Throws an error if the key's type is neither number nor string.
 */
export function SortFn<T>(key: keyof T): (a: T, b: T) => number {
    return (a: T, b:T): number => {
        const type = typeof a[key];
        switch (type) {
            case 'number': return (b[key] as number) - (a[key] as number);
            case 'string': return (a[key] as string).localeCompare(b[key] as string);
            default: throw new Error(`Can't sort by key "${key as string}" of type ${type}`);
        }
    }
}
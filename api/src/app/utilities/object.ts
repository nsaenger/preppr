import {empty} from "./dataUtils";

/**
 * Transforms the keys of an object to start with a lowercase letter.
 * Recursively processes nested objects and arrays if specified.
 *
 * @param {any} obj - The input object whose keys need to be uncapitalized. Can also accept arrays, dates, or non-object types.
 * @param {boolean} [recursive=true] - Indicates whether to recursively process nested objects and arrays.
 * @returns {any} A new object or array with keys uncapitalized where applicable, leaving other types unchanged.
 */
export const uncapitalizeKeys = (obj: any, recursive: boolean = true): any => {
    if (empty(obj) || typeof obj !== "object") {
        return obj;
    } else if (Array.isArray(obj)) {
        return obj.map(item => uncapitalizeKeys(item));
    } else if (obj instanceof Date) {
        return obj;
    }

    return Object.fromEntries(
        Object.entries(obj).map(
            ([k, v]) => [k.charAt(0).toLowerCase() + k.slice(1), recursive ? uncapitalizeKeys(v) : v]
        )
    );
};

import {Instance} from "./injector";
import {Connector} from "./connector";
import {MongoEntity} from "../types/mongoEntity";


/**
 * Abstract class representing a generic data service with CRUD operations and sanitization capabilities.
 *
 * @template T - The type of the entity managed by this service.
 * @template ConnectorType - The type of the connector used to interact with the data source.
 */
export abstract class DataService<T extends MongoEntity, ConnectorType extends Connector<T>> implements Instance {

    public readonly collectionName: string;
    protected connector: ConnectorType;

    /**
     * Constructs an instance of the class with the specified collection name and connector.
     *
     * @param {string} collectionName - The name of the collection associated with this instance.
     * @param {ConnectorType} connector - The connector used for database or service connections.
     * @return {void}
     */
    protected constructor(collectionName: string, connector: ConnectorType) {
        this.collectionName = collectionName;
        this.connector = connector;
    }

    /**
     * Performs cleanup and de-initialization tasks when the component or service is being destroyed.
     * Typically used to unsubscribe from observables, detach event listeners, or release resources to prevent memory leaks.
     *
     * @return {void} No return value.
     */
    public onDestroy(): void {
    }


    /**
     * Retrieves all items from the collection and optionally applies sanitization.
     *
     * @param {boolean} [skipSanitization=false] - If true, sanitization will be skipped; otherwise, all items will be sanitized.
     * @return {Promise<T[]>} A promise that resolves to an array of items, optionally sanitized.
     */
    public async getAll(skipSanitization: boolean = false): Promise<T[]> {
        return this.connector.getAll(this.collectionName).then(data => data.map(d => this.sanitize(d)));
    };

    /**
     * Retrieves an entity by its unique identifier.
     *
     * @param {number | string} id - The unique identifier of the entity to retrieve.
     * @param {boolean} [skipSanitization=false] - If true, skips the sanitization of the retrieved data.
     * @return {Promise<T>} A promise that resolves to the retrieved entity.
     */
    public async getById(id: number | string, skipSanitization: boolean = false): Promise<T> {
        return this.connector.getById(this.collectionName, id).then(data => skipSanitization ? data : this.sanitize(data));
    }

    /**
     * Creates a new record in the collection associated with this instance.
     *
     * @param {T} data - The data to be stored in the collection.
     * @param {boolean} [skipSanitization=false] - Indicates whether to skip sanitization of the data before returning it.
     * @return {Promise<T>} A promise that resolves to the created and optionally sanitized record.
     */
    public async create(data: T, skipSanitization: boolean = false): Promise<T> {
        return this.connector.create(this.collectionName, data).then(data => skipSanitization ? data : this.sanitize(data));
    }

    /**
     * Updates a record in the specified collection and optionally skips data sanitization.
     *
     * @param {T} data - The data to be updated in the collection.
     * @param {boolean} [skipSanitization=false] - Whether to skip sanitization of the returned data.
     * @return {Promise<T>} A promise that resolves to the updated record, either sanitized or unsanitized based on the value of skipSanitization.
     */
    public async update(data: T, skipSanitization: boolean = false): Promise<T> {
        return this.connector.update(this.collectionName, data).then(data => skipSanitization ? data : this.sanitize(data));
    }

    /**
     * Updates multiple entries in the database collection and optionally sanitizes the updated data.
     *
     * @param {T[]} data - The array of data objects to be updated in the collection.
     * @param {boolean} [skipSanitization=false] - A flag to determine whether sanitization of updated objects should be skipped. Defaults to false.
     * @return {Promise<T[]>} - A promise that resolves to an array of updated (and optionally sanitized) data objects.
     */
    public async updateMany(data: T[], skipSanitization: boolean = false): Promise<T[]> {
        return Promise.all(data.map(
            (item: T) => this.connector.update(this.collectionName, item)
                .then(item => skipSanitization ? item : this.sanitize(item))
        ));
    }

    /**
     * Deletes an item from the collection identified by the given ID.
     *
     * @param {number|string} id - The unique identifier of the item to be deleted. Can be a number or a string.
     * @return {Promise<boolean>} A promise that resolves to `true` if the deletion was successful, or `false` otherwise.
     */
    public delete(id: number | string): Promise<boolean> {
        return this.connector.delete(this.collectionName, id);
    }

    /**
     * Finds a single record from the collection based on the provided query and bindings.
     *
     * @param {string} query - The query string used to locate the record in the collection.
     * @param {any[]} bindings - An array of bindings to parameterize the query.
     * @param {boolean} [skipSanitization=false] - If true, skips sanitization of the returned data.
     * @return {Promise<T>} A promise that resolves to the found record. If no record is found, the promise resolves to undefined.
     */
    public findOne(query: string, [...bindings]: any[], skipSanitization: boolean = false): Promise<T> {
        return this.connector.findOne(this.collectionName, query, bindings).then(data => skipSanitization ? data : this.sanitize(data));
    }

    /**
     * Fetches all data entries from the collection that match the given query.
     * Allows optional skipping of data sanitization.
     *
     * @param {string} query - The query string used to match entries in the collection.
     * @param {any[]} bindings - An array of bindings to parameterize the query.
     * @param {boolean} [skipSanitization=false] - Determines whether to skip sanitization of the results.
     * @return {Promise<T[]>} A promise that resolves to an array of matching entries.
     */
    public findAll(query: string, [...bindings]: any[], skipSanitization: boolean = false): Promise<T[]> {
        return this.connector.findAll(this.collectionName, query, bindings).then(data => data.map(d => skipSanitization ? d : this.sanitize(d)));
    }

    /**
     * Sanitizes the given data and ensures it meets the expected format or constraints.
     *
     * @param {T} data - The input data that needs to be sanitized.
     * @return {T} The sanitized data after processing.
     */
    public sanitize(data: T): T {
        return data;
    }
}
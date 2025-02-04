
/**
 * Interface representing a generic data connector for performing CRUD operations and custom queries.
 * @template T - The type of the data being managed by the connector.
 */
export interface Connector<T> {
    /**
     * Creates a new document within the specified collection using the provided data.
     *
     * @param {string} collectionName - The name of the collection where the document will be created.
     * @param {T} data - The data object representing the document to be created.
     * @return {Promise<T>} A promise that resolves to the created document.
     */
    create(collectionName: string, data: T): Promise<T>;

    /**
     * Deletes a document or record from the specified collection using its unique identifier.
     *
     * @param {string} collectionName - The name of the collection or table from which the item is to be deleted.
     * @param {number|string} id - The unique identifier of the document or record to be deleted.
     * @return {Promise<boolean>} A promise that resolves to true if the deletion is successful, otherwise false.
     */
    delete(collectionName: string, id: number | string): Promise<boolean>;

    /**
     * Retrieves all records from the specified collection that match the given query.
     *
     * @param {string} collectionName - The name of the collection to query.
     * @param {string} query - The SQL or query string to execute.
     * @param {...any[]} bindings - Optional bindings to parameterize the query.
     * @return {Promise<T[]>} A promise that resolves to an array of matching records.
     */
    findAll(collectionName: string, query: string, [...bindings]: any[]): Promise<T[]>;

    /**
     * Finds a single record in the specified collection that matches the given query and bindings.
     *
     * @param {string} collectionName - The name of the collection to search in.
     * @param {string} query - The query string to filter the records.
     * @param {...any[]} bindings - Optional additional parameters to bind to the query.
     * @return {Promise<T>} A promise that resolves with the first record matching the query, or null if no match is found.
     */
    findOne(collectionName: string, query: string, [...bindings]: any[]): Promise<T>;

    /**
     * Retrieves all documents from the specified collection.
     *
     * @param {string} collectionName - The name of the collection to retrieve documents from.
     * @return {Promise<T[]>} A promise that resolves to an array of documents from the collection.
     */
    getAll(collectionName: string): Promise<T[]>;

    /**
     * Retrieves an item by its unique identifier from the specified collection.
     *
     * @param {string} collectionName - The name of the collection from which to fetch the item.
     * @param {number|string} id - The unique identifier of the item to retrieve. Can be a number or a string.
     * @return {Promise<T>} A promise that resolves to the item of type T if found, or rejects with an error.
     */
    getById(collectionName: string, id: number | string): Promise<T>

    /**
     * Updates a record in the specified collection with the provided data.
     *
     * @param {string} collectionName - The name of the collection to update.
     * @param {T} data - The data to update the record with.
     * @return {Promise<T>} A promise that resolves to the updated record.
     */
    update(collectionName: string, data: T): Promise<T>
}
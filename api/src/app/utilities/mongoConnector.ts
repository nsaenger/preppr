import {Injectable} from "./injectable";
import {Instance} from "./injector";
import {Db, Filter, MongoClient, ObjectId, WithId} from 'mongodb';
import {Connector} from "./connector";
import {Log} from "./type";
import {MongoEntity} from "@shared/types/mongo-entity";
import {DateTime} from "luxon";

/**
 * Provides a generic MongoDB connector implementation for managing collections and documents.
 * This class handles CRUD operations, transforms data between application and MongoDB formats,
 * and establishes a connection to the MongoDB instance.
 *
 * @template T The type of the entities managed by the connector. Should extend `MongoEntity`.
 */
@Injectable()
export class MongoConnector<T extends MongoEntity> implements Instance, Connector<T> {
    public db: Db;

    /**
     * Constructs a new instance of the class.
     *
     * @param {string} collectionName - The name of the collection to be associated with the instance.
     */
    public constructor(
        private readonly collectionName: string
    ) {
    }

    /**
     * Initializes a MongoDB connection using environment variables or default values.
     * The connection is established with authentication and logged on successful connection.
     *
     * @return {Promise<void>} A promise that resolves when the MongoDB connection is successfully established.
     */
    public async init(): Promise<void> {
        const user = process.env.MONGO_USER ?? 'root';
        const password = process.env.MONGO_PASSWORD ?? 'root';
        const server = process.env.MONGO_SERVER ?? 'localhost';
        const port = process.env.MONGO_PORT ?? 27017;
        const dataBase = process.env.MONGO_DATABASE ?? 'preppr';

        const connection = await new MongoClient(`mongodb://${user}:${password}@${server}:${port}/${dataBase}`, {authSource: "admin"}).connect();
        Log.info(`Connected to mongoDB on ${server}:${port}/${dataBase}`);
        this.db = connection.db(dataBase);
    }

    /**
     * Creates a new document in the specified collection with the provided data.
     *
     * @param {string} collectionName - The name of the collection where the data will be inserted.
     * @param {T} data - The data object to be added to the collection.
     * @return {Promise<T>} A promise that resolves to the inserted data including the generated ID and timestamps.
     */
    public async create(collectionName: string, data: T): Promise<T> {
        const document = this.toDocument(data);
        document.updatedAt = document.updatedAt ?? DateTime.now();
        document.createdAt = document.createdAt ?? DateTime.now();

        return this.db.collection(collectionName).insertOne(document as any).then((response) => {
            data._id = response.insertedId.toString();
            return data;
        });
    }

    /**
     * Deletes a document from the specified collection by its identifier.
     *
     * @param {string} collectionName - The name of the collection from which the document will be deleted.
     * @param {number} id - The identifier of the document to be deleted.
     * @return {Promise<boolean>} A promise resolving to true if the document was successfully deleted, false otherwise.
     */
    public async delete(collectionName: string, id: string): Promise<boolean> {
        return this.db.collection(collectionName).deleteOne({'_id': new ObjectId(id)}).then((response) => {
            return response.deletedCount === 1;
        });
    }

    /**
     * Retrieves all documents from a specified collection.
     *
     * @param {string} collectionName - The name of the collection to retrieve documents from.
     * @return {Promise<T[]>} A promise that resolves to an array of documents of type T.
     */
    public getAll(collectionName: string): Promise<T[]> {
        return this.findAll(collectionName, '', []);
    }

    /**
     * Retrieves a single document from the specified collection based on its unique identifier.
     *
     * @param {string} collectionName - The name of the collection to query.
     * @param {number} id - The unique identifier of the document to retrieve.
     * @return {Promise<T>} A promise that resolves to the document matching the given identifier.
     */
    public getById(collectionName: string, id: number): Promise<T> {
        return this.findOne(collectionName, '_id = ?', [new ObjectId(id)]);
    }

    /**
     * Updates a document in the specified collection with the provided data.
     * Converts the data into a document format, applies a modified timestamp,
     * and updates the corresponding record in the database.
     *
     * @param {string} collectionName - The name of the collection where the update should occur.
     * @param {T} data - The data object to update, which will be converted into a document.
     * @return {Promise<T>} Returns the updated document if the update is successful,
     * or `null` if no document is modified. In case of an error, returns the error object.
     */
    public async update(collectionName: string, data: T): Promise<T> {
        const document = this.toDocument(data);
        document.updatedAt = DateTime.now();

        return this.db.collection(collectionName).updateOne({'_id': new ObjectId(document._id)}, {$set: document})
            .then((response) => {
                Log.info(response);
                return response.modifiedCount === 1 ? document : null;
            })
            .catch((error) => {
                Log.error(error);
                return error;
            });
    }

    /**
     * Fetches a single record from the specified collection that matches the given query and parameters.
     *
     * @param {string} collectionName - The name of the collection to query.
     * @param {string} query - The query string to execute against the collection.
     * @param {any[]} params - The parameters to bind to the query.
     * @return {Promise<T>} A promise that resolves to the first matching record or `null` if no match is found.
     */
    public async findOne(collectionName: string, query: string, params: any[]): Promise<T> {
        return this.findAll(collectionName, query, params).then(data => data[0] ?? null);
    }

    /**
     * Retrieves all documents from a given collection that match the specified query and parameters.
     *
     * @param {string} collectionName - The name of the database collection to search.
     * @param {string} query - A string defining the filter conditions, separated by "AND" clauses and using "=" for key-value matching.
     * @param {any[]} params - An array of values to be matched against the keys defined in the query.
     * @param single
     * @return {Promise<T[]>} A promise that resolves to an array of documents matching the query conditions.
     */
    public findAll(collectionName: string, query: string, params: any[], single: boolean = false): Promise<T[]> {
        const filters = query.split(" AND ")

        const filter: Filter<T> = {};

        filters.map((f, idx) => {
            const parts = f.split("=");
            if (parts.length > 1) {
                const key = parts[0].trim() as keyof Filter<T>;

                filter[key] = params[idx] as any;
            }
        });

        return new Promise<T[]>((resolve, reject) => {
            if (single)
                this.db.collection<T>(collectionName)
                    .findOne(filter)
                    .then(this.sanitize.bind(this))
                    .then(data => {
                        resolve([data] as T[]);
                    });
            else
                this.db.collection<T>(collectionName)
                    .find(filter).toArray()
                    .then(data => data.map(this.sanitize.bind(this)))
                    .then(data => {
                        resolve(data as T[]);
                    });
        });
    }

    public sanitize(data: WithId<T>): WithId<T> {
        const keys: (keyof WithId<T>)[] = Object.keys(data) as (keyof WithId<T>)[];
        for (let key of keys) {
            const value = data[key];

            if (typeof value === "string") {
                const maybeDateTime = DateTime.fromISO(value);
                data[key] = (maybeDateTime.isValid ? maybeDateTime : data[key]) as any;
            }
        }
        return data;
    }


    /**
     * This method is called when the component or object is being destroyed.
     * It is typically used for cleanup operations, such as unsubscribing from
     * observables, detaching event listeners, or releasing resources.
     *
     * @return {void} Does not return any value.
     */
    public onDestroy(): void {
    }

    /**
     * Transforms the provided data of generic type T into a document of type WithId<T>.
     *
     * @param {T} document - The data object to be transformed into a document. It must contain an `id` property which will be converted to `_id`.
     * @return {WithId<T>} - Returns an object of type WithId<T> with the `id` property replaced by `_id` and any Moment objects converted to ISO strings.
     */
    private toDocument(document: T): T {

        for (let key of Object.keys(document) as (keyof T)[]) {
            if (!!document[key] && document[key] instanceof DateTime) {
                document[key] = (document[key] as any as DateTime).toString() as any;
            }
        }

        return document;
    }
}
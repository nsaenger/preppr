import {Injectable} from "./injectable";
import {Instance} from "./injector";
import {Connector} from "./connector";
import {Log} from "./type";
import {createClient, RedisClientType, RedisDefaultModules, RedisFunctions, RedisModules, RedisScripts} from 'redis';

/**
 * Injectable service that provides methods for interacting with a Redis database.
 * This class implements the `Instance` and `Connector` interfaces and offers CRUD operations
 * as well as connection management for Redis.
 *
 * @template T The type of data objects handled by the connector, which must have `key` and `value` properties.
 */
@Injectable()
export class RedisConnector<T extends { key: string, value: string }> implements Instance, Connector<T> {

    /**
     * Represents a client instance for interacting with a Redis database.
     *
     * This `client` variable is an instance of the `RedisClientType` class, which provides the ability
     * to execute operations on the Redis server. It supports default Redis commands, custom modules,
     * user-defined functions, and scripts.
     *
     * Type Parameters:
     * - RedisDefaultModules & RedisModules: Includes the default Redis modules and any additional modules provided.
     * - RedisFunctions: Represents user-defined functions for extending Redis functionality.
     * - RedisScripts: Represents user-defined Lua scripts for execution in Redis.
     *
     * The client can be used for performing various Redis operations like getting, setting, or modifying data. It
     * also allows the execution of custom functions and scripts, providing a flexible and powerful interface
     * to work with Redis.
     */
    public client: RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts>;

    /**
     * Constructs a new instance of the class with the specified collection name
     * and initializes a connection.
     *
     * @param {string} collectionName - The name of the collection to be used.
     */
    public constructor( private readonly collectionName: string ) {
        this.connect(true);
    }

    /**
     * Disconnects the client if it is currently connected.
     * This method ensures that the client is safely disconnected and sets the client instance to null.
     *
     * @return {void} Does not return any value.
     */
    public disconnect(): void {
        if (this.client)
            this.client.disconnect().then(() => this.client = null);
    }

    /**
     * Establishes a connection to the Redis database. If a connection already exists and is open,
     * it resolves the existing client instance. Otherwise, it initializes and connects a new Redis client.
     *
     * @param {boolean} [first=false] - Optional flag indicating whether it is the first connection attempt.
     * @return {Promise<RedisClientType>} A promise that resolves with the active Redis client instance.
     */
    public async connect(first: boolean = false) {
        const password = process.env.REDIS_PASSWORD ?? 'password';
        const host = process.env.REDIS_SERVER ?? 'localhost';
        const port = parseInt(process.env.REDIS_PORT ?? "6379", 10);

        const redisConfig = {
            password: password,
            socket: {host, port, connectTimeout: 10000},
            pingInterval: 1000,
        };

        if (this.client && this.client.isOpen && this.client.isReady)
            return Promise.resolve(this.client);

        this.client = await createClient(redisConfig).connect();
        Log.info("Connected to redisDB");

        return this.client;
    }

    /**
     * Performs necessary cleanup when the component or object is destroyed.
     * This includes disconnecting any active connections or listeners
     * to prevent memory leaks and ensure proper resource management.
     *
     * @return {void} Does not return a value.
     */
    public onDestroy(): void {
        this.disconnect();
    }

    /**
     * Creates a new entry in the specified collection in the database.
     *
     * @param {string} collectionName - The name of the collection where the data should be inserted.
     * @param {T} data - The data object to be stored, containing a key and value.
     * @return {Promise<T>} A promise that resolves to the inserted data object if successful, or null if an error occurs.
     */
    async create(collectionName: string, data: T): Promise<T> {
        await this.connect();
        return this.client.set(data.key, data.value).then(() => {
            return data;
        }).catch(error => {
            Log.error('Redis Client Error: ', error);
            return null;
        });
    }

    /**
     * Deletes a specific key from the specified collection in the database.
     *
     * @param {string} collectionName - The name of the collection from which the key needs to be deleted.
     * @param {string} key - The key to be deleted from the collection.
     * @return {Promise<boolean>} A promise that resolves to true if the key was deleted successfully, or false if an error occurred.
     */
    async delete(collectionName: string, key: string): Promise<boolean> {
        await this.connect();
        return this.client.del(key).then(() => {
            return true;
        }).catch(error => {
            Log.error('Redis Client Error: ', error);
            return false;
        });
    }

    /**
     * Retrieves a value from the Redis database by its key.
     *
     * @param {string} collectionName - The name of the collection or namespace in the Redis database.
     * @param {string} key - The key of the item to retrieve from the specified collection.
     * @return {Promise<T>} A promise that resolves to the retrieved value and its key,
     * or null if an error occurs during retrieval.
     */
    async getById(collectionName: string, key: string): Promise<T> {
        await this.connect();
        return this.client.get(key).then((value) => {
            return {key, value};
        }).catch(error => {
            Log.error('Redis Client Error: ', error);
            return null;
        });
    }

    /**
     * Retrieves all documents from the specified collection.
     *
     * @param {string} collectionName - The name of the collection to retrieve documents from.
     * @return {Promise<T[]>} A promise that resolves to an array of documents of type T.
     */
    public getAll(collectionName: string): Promise<T[]> {
        throw new Error("Method not implemented.");
    }

    /**
     * Updates a specific record in the given collection with the provided data.
     *
     * @param {string} collectionName - The name of the collection where the update will be performed.
     * @param {T} data - The data object that will be used to update the record in the collection.
     * @return {Promise<T>} A promise that resolves to the updated record.
     */
    public update(collectionName: string, data: T): Promise<T> {
        throw new Error("Method not implemented.");
    }

    /**
     * Fetches a single record from the specified collection that matches the given query and binding values.
     *
     * @param {string} collectionName - The name of the collection to search.
     * @param {string} query - The query string used to find the record.
     * @param {any[]} bindings - Optional parameters to be bound to the query placeholders.
     * @return {Promise<T>} A promise that resolves with the found record or rejects if no record matches.
     */
    public findOne(collectionName: string, query: string, [...bindings]: any[]): Promise<T> {
        throw new Error("Method not implemented.");
    }

    /**
     * Retrieves all matching documents from the specified collection based on the provided query and bindings.
     *
     * @param {string} collectionName - The name of the collection to query.
     * @param {string} query - The query string used to filter the results.
     * @param {...any[]} bindings - Optional parameters to bind within the query for dynamic filtering.
     * @return {Promise<T[]>} A promise that resolves to an array of objects of type T matching the query criteria.
     */
    public findAll(collectionName: string, query: string, [...bindings]: any[]): Promise<T[]> {
        throw new Error("Method not implemented.");
    }
}
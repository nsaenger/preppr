import 'reflect-metadata';
import {Type} from './type';


/**
 * Represents an instance with an optional lifecycle method.
 * This interface defines a structure for an object that may
 * optionally include a method to handle clean-up or teardown
 * operations when the instance is no longer needed.
 *
 * @interface Instance
 * @property {Function} [onDestroy] - Optional method to perform
 * teardown or clean-up actions specific to the instance. It is
 * invoked when the instance is being destroyed. This method does
 * not take any parameters and does not return any value.
 */
export interface Instance {
    onDestroy?(): void;
}

/**
 * Represents an object structure that consists of a type and an instance.
 *
 * This interface is used to define objects that pair a Type with a specific instance of that type.
 *
 * @template Type - The specific type of the object.
 * @property {Type<any>} type - The type of the instance which determines its structure or implementation.
 * @property {Instance} instance - The actual implementation or object instance corresponding to the defined type.
 */
export interface InstanceObject {
    type: Type<any>,
    instance: Instance
}

/**
 * Injector is a singleton dependency injection container. It is used to manage the lifecycle
 * and resolution of class instances (dependencies) throughout the application.
 *
 * The container allows for resolving instances of classes using metadata about their constructor parameters.
 * Instances are cached in the container, ensuring single instantiation for each type unless explicitly rebooted.
 */
export const Injector = new class {


    /**
     * An array to store instances of `InstanceObject`.
     * Each element in the array represents an instance of type `InstanceObject`.
     */
    instances: InstanceObject[] = [];

    /**
     * Resolves an instance of the given target type by either returning an existing instance
     * or creating a new one. If the target type has dependencies, they are resolved recursively.
     *
     * @param {Type<any>} target - The class type to resolve.
     * @return {T} The resolved instance of the target type.
     * @throws {Error} If the target type is undefined or if an error occurs during resolution.
     */
    public resolve<T extends Instance>(target: Type<any>): T {
        if (!target) {
            throw new Error('Cannot resolve undefined type');
        }

        try {
            let tokens = Reflect.getMetadata('design:paramtypes', target) || [];
            let injections = tokens.map((token: any) => Injector.resolve<any>(token));

            const instance = this.instances.find(entry => entry.type === target);

            if (instance) {
                return instance.instance as T;
            } else {
                const newInstance = {
                    type: target,
                    instance: new target(...injections),
                };

                this.instances.push(newInstance);

                return newInstance.instance;
            }
        } catch (e: any) {
            const error: Error = e;
            throw new Error(`Cannot resolve type ${target}: ${error.message}`);
        }
    }

    /**
     * Injects an instance of the specified type from a collection of available instances.
     *
     * @param {Type<any>} target - The type of the object to retrieve from the available instances.
     * @return {T} The instance of the specified type if found, or `null` if no matching instance exists.
     */
    public inject<T>(target: Type<any>): T {
        const instanceObject = this.instances.find(entry => entry.type === target);
        return (instanceObject ? instanceObject.instance : null) as T;
    }

    /**
     * Retrieves all valid instances from the internal collection.
     *
     * Filters out any undefined entries and ensures only entries
     * with a defined instance property are included in the result.
     *
     * @return {Instance[]} An array of valid instances.
     */
    public getAll(): Instance[] {
        return this.instances
            .filter(i => i !== undefined && i.instance !== undefined)
            .map(i => i.instance);
    }

    /**
     * Reboots the system by invoking the `onDestroy` method on all instances, if it exists,
     * and then resets the instances list to an empty array.
     *
     * @return {void} No return value.
     */
    public reboot(): void {
        this.getAll()
            .map(instance => {
                if (typeof (instance.onDestroy) === 'function') {
                    instance.onDestroy();
                }
            });
        this.instances = [];
    }
};

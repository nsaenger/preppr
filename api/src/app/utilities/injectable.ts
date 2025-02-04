import {Injector, Instance} from './injector';
import {GenericClassDecorator, Type} from './type';


/**
 * A decorator that registers a class with dependency injection, enabling the automatic resolution
 * of its constructor arguments based on their types and predefined injections.
 *
 * @template T - The type of the instance being decorated.
 * @return {GenericClassDecorator<Type<T>>} A class decorator function that resolves and injects dependencies into the target class.
 */
export function Injectable<T extends Instance>(): GenericClassDecorator<Type<T>> {
    return (target: Type<T>) => {
        const tokens = Reflect.getMetadata('design:paramtypes', target) || [];
        const injections = tokens.map((token: any) => Injector.resolve<any>(token));

        const instance = new target(...injections);

        Injector.instances.push({
            type: target,
            instance: instance,
        });
    };
}
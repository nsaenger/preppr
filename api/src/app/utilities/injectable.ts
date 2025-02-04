import { Injector, Instance } from './injector';
import { GenericClassDecorator, Type } from './type';


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
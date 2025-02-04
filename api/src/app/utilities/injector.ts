import 'reflect-metadata';
import { Type } from './type';


export interface Instance {
  onDestroy?(): void;
}

export const Injector = new class {
  instances: { type: Type<any>, instance: Instance }[] = [];

  resolve<T extends Instance>(target: Type<any>): T {
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
  }

  inject<T>(target: Type<any>): T {
    const instanceObject = this.instances.find(entry => entry.type === target);
    return (instanceObject ? instanceObject.instance : null) as T;
  }

  public getAll(): Instance[] {
    return this.instances
      .filter(i => i !== undefined && i.instance !== undefined)
      .map(i => i.instance);
  }

  public reboot() {
    this.getAll()
      .map(instance => {
        if (typeof (instance.onDestroy) === 'function') {
          instance.onDestroy();
        }
      });
    this.instances = [];
  }
};

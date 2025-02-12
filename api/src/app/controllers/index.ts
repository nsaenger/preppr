import {ControllerInstance} from "../utilities/controller";
import {IndexController} from "./index/index.controller";
import {UserController} from "./User/user.controller";
import {SettingsController} from "./Settings/settings.controller";
import {AuthController} from "./Auth/auth.controller";
import {Injectable} from "../utilities/injectable";
import {Injector, Instance} from "../utilities/injector";
import {InventoryController} from "./Inventory/inventory.controller";

@Injectable()
export class Router implements Instance {
    onDestroy?(): void {}
    public routes: ControllerInstance[] = [];

    constructor(
    ) {
        this.routes = [
            Injector.resolve(IndexController),
            Injector.resolve(AuthController),
            Injector.resolve(UserController),
            Injector.resolve(SettingsController),
            Injector.resolve(InventoryController)
        ]
    }
}

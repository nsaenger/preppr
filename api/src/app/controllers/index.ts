import {ControllerInstance} from "../utilities/controller";
import {IndexController} from "./index/index.controller";
import {UserController} from "./User/user.controller";
import {SettingsController} from "./Settings/settings.controller";
import {AuthController} from "./Auth/auth.controller";

export const Controllers: typeof ControllerInstance[] = [
    // Application
    IndexController,

    // Settings
    AuthController,
    UserController,
    SettingsController,
];

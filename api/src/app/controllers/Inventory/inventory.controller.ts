import {Controller, ControllerInstance, DataController,} from "../../utilities/controller";
import {MIDDLEWARE} from "../../application";
import {Item} from "@shared/types/item";
import {ItemService} from "../../services/item/item.service";
import {TimeSpan} from "../../utilities/time-span.class";


@Controller({
    middlewares: [MIDDLEWARE.NO_AUTH]
})
export class InventoryController extends DataController<Item, ItemService> implements ControllerInstance {

    constructor(
        service: ItemService,
    ) {
        super(service, TimeSpan.fromMinutes(5));
    }
}
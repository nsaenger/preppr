import {Injectable} from "../../utilities/injectable";
import {DataService} from "../../utilities/data.service";
import {MongoConnector} from "../../utilities/mongoConnector";
import {Log} from "../../utilities/type";
import {Item, ItemType} from "@shared/types/item";
import {DateTime} from "luxon";

@Injectable()
export class ItemService extends DataService<Item, MongoConnector<Item>> {

    constructor(
        connector: MongoConnector<Item>
    ) {
        super("items", connector);
    }

    public init() {
        this.getAll().then((items) => {
            if (items.length === 0) {
                this.create({
                    brand: "Ballistol",
                    category: "",
                    createdAt: DateTime.now(),
                    deleted: false,
                    description: "",
                    image: "",
                    name: "",
                    price: 0,
                    quantity: 0,
                    tags: [],
                    type: ItemType.EQUIPMENT,
                    updatedAt: DateTime.now(),
                }).then(() => {
                    Log.info("Items table initialized, example item created");
                });
            }
        });
    }
}
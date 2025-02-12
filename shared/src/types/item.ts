import {MongoEntity} from "./mongo-entity";

export const enum ItemType {
    FOOD = "food",
    EQUIPMENT = "equipment",
    WEARABLE = "wearable",
    WEAPON = "weapon",
    AMMO = "ammo",
}

export const enum FoodUnit {
    KILOGRAMS = "kg",
    LITERS = "l",
    PIECES = "pcs",
}

export const enum WearableSize {
    XXS = "xxs",
    XS = "xs",
    S = "s",
    MEDIUM = "m",
    L = "l",
    XL = "xl",
    XXL = "xxl",
}

export const enum WearableAge {
    TODDLER = "toddler",
    CHILD = "child",
    TEEN = "teen",
    ADULT = "adult"
}

export interface Item extends MongoEntity {
    type: ItemType;
    brand: string;
    name: string;
    quantity: number;
    tags: string[];
    price: number;
    image: string;
    category: string;
    description: string;
}

export interface FoodItem extends Item {
    type: ItemType.FOOD;
    allergens: string[];
    calories: number;
    barcode: string;
    carbs: number;
    currency: string;
    fat: number;
    ingredients: string[];
    origin: string;
    protein: number;
    unit: FoodUnit;
}

export interface EquipmentItem extends Item {
    type: ItemType.EQUIPMENT;
}

export interface WearableItem extends Item {
    type: ItemType.WEARABLE;
    size: WearableSize;
    age: WearableAge;
    color: string;
    material: string;
    gender: string;
}

export interface WeaponItem extends Item {
    type: ItemType.WEAPON;
    caliber: string;
    weaponType: string;
    concealable: boolean;
}

export interface AmmoItem extends Item {
    type: ItemType.AMMO;
    caliber: string;
    ammoType: string;
}
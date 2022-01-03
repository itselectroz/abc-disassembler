import { custom, u30, vector } from "../defined-transformer-types";
import { Structure } from "../structure";
import { ItemInfo } from "./item-info";

export class MetadataInfo extends Structure {
    name: u30 = 0;
    items: vector<custom<ItemInfo>, u30> = [];
}
ItemInfo
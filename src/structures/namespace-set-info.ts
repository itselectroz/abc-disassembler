import { u30, vector } from "../defined-transformer-types";
import { Structure } from "../structure";

export class NSSetInfo extends Structure {
    count: u30 = 0;
    ns: vector<u30, "count"> = [];
}
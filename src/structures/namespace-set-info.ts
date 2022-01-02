import { u30, vector } from "../defined-transformer-types";
import { Structure } from "../structure";

export class NSSetInfo extends Structure {
    ns: vector<u30, u30> = [];
}
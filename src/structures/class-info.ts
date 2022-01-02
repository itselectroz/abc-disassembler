import { custom, u30, vector } from "../defined-transformer-types";
import { Structure } from "../structure";
import { TraitsInfo } from "./traits-info";

export class ClassInfo extends Structure {
    cinit: u30 = 0;
    traits: vector<custom<TraitsInfo>, u30> = [];
}
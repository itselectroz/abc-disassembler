import { custom, u30, vector } from "../defined-transformer-types";
import { Structure } from "../structure";
import { TraitsInfo } from "./traits-info";

export class ScriptInfo extends Structure {
    init: u30 = 0;
    trait: vector<custom<TraitsInfo>, u30> = [];
}
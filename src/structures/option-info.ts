import { custom, u30, vector } from "../defined-transformer-types";
import { Structure } from "../structure";
import { OptionDetail } from "./option-detail";

export class OptionInfo extends Structure {
    option: vector<custom<OptionDetail>, u30> = [];
}
OptionDetail
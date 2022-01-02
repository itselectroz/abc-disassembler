import { u30, u8 } from "../defined-transformer-types";
import { Structure } from "../structure";

export class OptionDetail extends Structure {
    val: u30 = 0;
    kind: u8 = 0;
}
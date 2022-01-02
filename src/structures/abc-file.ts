import { u16, u30 } from "../defined-transformer-types";
import { Structure } from "../structure";

export class AbcFile extends Structure {
    minor_version: u16 = 0;
    major_version: u16 = 0;
}
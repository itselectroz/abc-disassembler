import { u30, u8 } from "../defined-transformer-types";
import { Structure } from "../structure";

export class NamespaceInfo extends Structure {
    kind: u8 = 0;
    name: u30 = 0;
}
import { custom, optional, u30, u8, vector } from "../defined-transformer-types";
import { Structure } from "../structure";
import { TraitsInfo } from "./traits-info";

export enum InstanceInfoFlags {
    ClassSealed = 0x1,
    ClassFinal = 0x2,
    ClassInterface = 0x4,
    ClassProtectedNs = 0x8
}

export class InstanceInfo extends Structure {
    name: u30 = 0;
    super_name: u30 = 0;
    flags: u8 = 0;
    protectedNs: optional<u30, "hasProtectedNsFlag"> = 0;
    interface: vector<u30, u30> = [];
    iinit: u30 = 0;
    trait: vector<custom<TraitsInfo>, u30> = [];

    hasProtectedNsFlag() {
        return (this.flags & InstanceInfoFlags.ClassProtectedNs) != 0;
    }
}
TraitsInfo
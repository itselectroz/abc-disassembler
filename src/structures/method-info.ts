import { custom, optional, u30, u8, vector } from "../defined-transformer-types";
import { Structure } from "../structure";
import { OptionInfo } from "./option-info";

export enum MethodInfoFlags {
    NEED_ARGUMENTS = 0x1,
    NEED_ACTIVATION = 0x2,
    NEED_REST = 0x4,
    HAS_OPTIONAL = 0x8,
    SET_DXNS = 0x40,
    HAS_PARAM_NAMES = 0x80
}

export class MethodInfo extends Structure {
    param_count: u30 = 0;
    return_type: u30 = 0;
    param_type: vector<u30, "param_count"> = [];
    name: u30 = 0;
    flags: u8 = 0;
    
    options: optional<custom<OptionInfo>, "hasOptionalFlag"> = null as any;
    param_names: optional<vector<string, "param_count">, "hasParamNamesFlag"> = null as any;

    hasOptionalFlag() {
        return (this.flags & MethodInfoFlags.HAS_OPTIONAL) != 0;
    }

    hasParamNamesFlag() {
        return (this.flags & MethodInfoFlags.HAS_PARAM_NAMES) != 0;
    }
}
OptionInfo
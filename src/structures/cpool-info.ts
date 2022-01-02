import { custom, d64, s32, u30, u32, vector } from "../defined-transformer-types";
import { Structure } from "../structure";
import { MultinameInfo } from "./multiname-info";
import { NamespaceInfo } from "./namespace-info";
import { NSSetInfo } from "./namespace-set-info";

export class CPoolInfo extends Structure {
    int_count: u30 = 0;
    integer: vector<s32, "int_count"> = [];

    uint_count: u30 = 0;
    uinteger: vector<u32, "uint_count"> = [];

    double_count: u30 = 0;
    double: vector<d64, "double_count"> = [];

    string_count: u30 = 0;
    string: vector<string, "string_count"> = [];

    namespace_count: u30 = 0;
    namespace: vector<custom<NamespaceInfo>, "namespace_count"> = [];

    ns_set_count: u30 = 0;
    ns_set: vector<custom<NSSetInfo>, "ns_set_count"> = [];

    multiname_count: u30 = 0;
    multiname: vector<custom<MultinameInfo>, "multiname_count"> = [];
}
NamespaceInfo;
NSSetInfo;
MultinameInfo;
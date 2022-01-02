import { custom, d64, s32, u30, u32, vector } from "../defined-transformer-types";
import { Structure } from "../structure";
import { MultinameInfo } from "./multiname-info";
import { NamespaceInfo } from "./namespace-info";
import { NSSetInfo } from "./namespace-set-info";

export class CPoolInfo extends Structure {
    integer: vector<s32, u30> = [];
    uinteger: vector<u32, u30> = [];
    double: vector<d64, u30> = [];
    string: vector<string, u30> = [];
    namespace: vector<custom<NamespaceInfo>, u30> = [];
    ns_set: vector<custom<NSSetInfo>, u30> = [];
    multiname: vector<custom<MultinameInfo>, u30> = [];
}
NamespaceInfo;
NSSetInfo;
MultinameInfo;
import { custom, u16, u30, vector } from "../defined-transformer-types";
import { Structure } from "../structure";
import { ClassInfo } from "./class-info";
import { CPoolInfo } from "./cpool-info";
import { InstanceInfo } from "./instance-info";
import { MetadataInfo } from "./metadata-info";
import { MethodBodyInfo } from "./method-body-info";
import { MethodInfo } from "./method-info";
import { ScriptInfo } from "./script-info";

export class AbcFile extends Structure {
    minor_version: u16 = 0;
    major_version: u16 = 0;
    constant_pool: custom<CPoolInfo> = null as any;
    method: vector<custom<MethodInfo>, u30> = [];
    metadata_info: vector<custom<MetadataInfo>, u30> = [];
    class_count: u30 = 0;
    instance: vector<custom<InstanceInfo>, "class_count"> = [];
    class: vector<custom<ClassInfo>, "class_count"> = [];
    script: vector<custom<ScriptInfo>, u30> = [];
    method_body: vector<custom<MethodBodyInfo>, u30> = [];
}
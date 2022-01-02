import { custom, u30, u8, vector } from "../defined-transformer-types";
import { Structure } from "../structure";
import { ExceptionInfo } from "./exception-info";
import { TraitsInfo } from "./traits-info";

export class MethodBodyInfo extends Structure {
    method: u30 = 0;
    max_stack: u30 = 0;
    local_count: u30 = 0;
    init_scope_depth: u30 = 0;
    max_scope_depth: u30 = 0;
    code: vector<u8, u30> = [];
    exception: vector<custom<ExceptionInfo>, u30> = [];
    trait: vector<custom<TraitsInfo>, u30> = [];
}
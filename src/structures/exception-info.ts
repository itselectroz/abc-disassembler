import { u30 } from "../defined-transformer-types";
import { Structure } from "../structure";

export class ExceptionInfo extends Structure {
    from: u30 = 0;
    to: u30 = 0;
    target: u30 = 0;
    exc_type: u30 = 0;
    var_name: u30 = 0;
}
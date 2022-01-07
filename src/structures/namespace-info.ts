import { u30, u8 } from "../defined-transformer-types";
import { Structure } from "../structure";

export enum NamespaceKind {
    Namespace = 0x8,
    PackageNamespace = 0x16,
    PackageInternalNs = 0x17,
    ProtectedNamespace = 0x18,
    ExplicitNamespace = 0x19,
    StaticProtectedNs = 0x1A,
    PrivateNs = 0x5
};

export class NamespaceInfo extends Structure {
    kind: u8 = 0;
    name: u30 = 0;
}
import { u30, u8, vector } from "../defined-transformer-types";
import ExtendedBuffer from "../extended-buffer";
import { Structure } from "../structure";

export enum MultinameKind {
    QName = 0x07,
    QNameA = 0x0D,
    RTQName = 0x0F,
    RTQNameA = 0x10,
    RTQNameL = 0x11,
    RTQNameLA = 0x12,
    Multiname = 0x09,
    MultinameA = 0x0E,
    MultinameL = 0x1B,
    MultinameLA = 0x1C
}

"ignore"
export class MultinameInfo extends Structure {
    kind: MultinameKind = 0;
    data: MultinameKindQName | MultinameKindRTQName | MultinameKindRTQNameL | MultinameKindMultiname | MultinameKindMultinameL = null as any;

    static read(data: ExtendedBuffer): MultinameInfo {
        const structure = new MultinameInfo();
        structure.kind = data.readUInt8() as MultinameKind;

        switch(structure.kind) {
            case MultinameKind.QName:
            case MultinameKind.QNameA:
                structure.data = MultinameKindQName.read(data);
                break;
            
            case MultinameKind.RTQName:
            case MultinameKind.RTQNameA:
                structure.data = MultinameKindRTQName.read(data);
                break;

            case MultinameKind.RTQNameL:
            case MultinameKind.RTQNameLA:
                structure.data = MultinameKindRTQName.read(data);
                break;
            
            case MultinameKind.Multiname:
            case MultinameKind.MultinameA:
                structure.data = MultinameKindMultiname.read(data);
                break;

            case MultinameKind.MultinameL:
            case MultinameKind.MultinameLA:
                structure.data = MultinameKindMultinameL.read(data);
                break;
        }

        return structure;
    }
}

export class MultinameKindQName extends Structure {
    ns: u30 = 0;
    name: u30 = 0;
}

export class MultinameKindRTQName extends Structure {
    name: u30 = 0;
}

export class MultinameKindRTQNameL extends Structure {

}

export class MultinameKindMultiname extends Structure {
    name: u30 = 0;
    ns_set: u30 = 0;
}

export class MultinameKindMultinameL extends Structure {
    ns_set: u30 = 0;
}
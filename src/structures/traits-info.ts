import { optional } from "..";
import { u30, u8, vector } from "../defined-transformer-types";
import { ExtendedBuffer } from "../extended-buffer";
import { Structure } from "../structure";

enum TraitTypes {
    Slot,
    Method,
    Getter,
    Setter,
    Class,
    Function,
    Const
}

enum TraitAttributes {
    Final = 0x1,
    Override = 0x2,
    Metadata = 0x4
}

"ignore"
export class TraitsInfo extends Structure {
    name: u30 = 0;
    kind: u8 = 0;
    data: TraitSlot | TraitClass | TraitFunction | TraitMethod = null as any;
    metadata: vector<u30, u30> = [];

    static read(data: ExtendedBuffer): TraitsInfo {
        const structure = new TraitsInfo();

        structure.name = data.readUInt30();
        structure.kind = data.readUInt8();

        switch (structure.kind & 0xF) {
            case TraitTypes.Slot:
            case TraitTypes.Const:
                structure.data = TraitSlot.read(data) as any;
                break;
            case TraitTypes.Class:
                structure.data = TraitClass.read(data) as any;
                break;
            case TraitTypes.Function:
                structure.data = TraitFunction.read(data) as any;
                break;
            case TraitTypes.Method:
            case TraitTypes.Getter:
            case TraitTypes.Setter:
                structure.data = TraitMethod.read(data) as any;
                break;
        }

        const attributes = (structure.kind >> 4);
        if((attributes & TraitAttributes.Metadata) != 0) {
            const length = data.readUInt30();
            structure.metadata = [];
            for (let i = 0; i < length; i++) {
                structure.metadata.push(data.readUInt30());
            }
        }

        return structure;
    }

    write(data: ExtendedBuffer) {
        data.writeUInt30(this.name);
        data.writeUInt8(this.kind);
        this.data.write(data);
        data.writeUInt30(this.metadata.length);
        for (let i = 0; i < this.metadata.length; i++) {
            data.writeUInt30(this.metadata[i]);
        }
    }
}

export class TraitSlot extends Structure {
    slot_id: u30 = 0;
    type_name: u30 = 0;
    vindex: u30 = 0;
    vkind: optional<u8, "hasVIndex"> = 0;

    hasVIndex() {
        return this.vindex != 0;
    }
}

export class TraitClass extends Structure {
    slot_id: u30 = 0;
    classi: u30 = 0;
}

export class TraitFunction extends Structure {
    slot_id: u30 = 0;
    function: u30 = 0;
}

export class TraitMethod extends Structure {
    disp_id: u30 = 0;
    method: u30 = 0;
}
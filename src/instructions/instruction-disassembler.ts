import { AbcFile, ExtendedBuffer, MethodBodyInfo, MultinameKindQName, TraitMethod, TraitTypes } from "..";
import { Instruction } from "./instruction";
import { InstructionFormatter } from "./instruction-formatter";
import { instructionMap } from "./instruction-list";

export class InstructionDisassembler {
    abcFile: AbcFile;

    constructor(abcFile: AbcFile) {
        this.abcFile = abcFile;
    }

    private readType(type: string, code: ExtendedBuffer, params: any[]): any {
        switch (type) {
            case "string":
                return this.abcFile.constant_pool.string[code.readUInt30() - 1];
            case "int":
                return this.abcFile.constant_pool.integer[code.readUInt30() - 1];
            case "u_int":
                return this.abcFile.constant_pool.uinteger[code.readUInt30() - 1];
            case "multiname":
                return this.abcFile.constant_pool.multiname[code.readUInt30() - 1];
            case "double":
                return this.abcFile.constant_pool.double[code.readUInt30() - 1];
            case "namespace":
                return this.abcFile.constant_pool.namespace[code.readUInt30() - 1];
            case "exception_info":
            case "class_info":
            case "method":
            case "u30":
                return code.readUInt30();

            case "offset":
            case "s24":
                return code.readInt24();

            case "u8":
                return code.readUInt8();
        }
        if (type.startsWith("array1")) {
            // Same as array, but + 1 on the length.
            const length = params[params.length - 1] + 1;
            if (typeof length != "number") {
                throw new Error(`Expected length to be of type 'number' got type '${typeof length}'`);
            }
            const valueType = type.split('-')[1];
            const arr = [];
            for (let i = 0; i < length; i++) {
                arr.push(this.readType(valueType, code, params));
            }
            return arr;
        }
        if (type.startsWith("array")) {
            // I think it's safe to assume that the last read value was the length of the array
            const length = params[params.length - 1];
            if (typeof length != "number") {
                throw new Error(`Expected length to be of type 'number' got type '${typeof length}'`);
            }
            const valueType = type.split('-')[1];
            const arr = [];
            for (let i = 0; i < length; i++) {
                arr.push(this.readType(valueType, code, params));
            }
            return arr;
        }

        throw new Error(`Unknown type '${type}'`);
    }

    disassemble(method: MethodBodyInfo) {
        const code = new ExtendedBuffer(Buffer.from(method.code));

        const instructions = [];

        while (code.bytesAvailable > 0) {
            const instructionId = code.readUInt8();

            const instructionData: any[] = instructionMap[instructionId];
            if (instructionData == undefined) {
                throw new Error(`Unable to find instruction with id ${instructionId}`);
            }

            const params = [];
            const numArgs = instructionData.length - 2;

            for (let i = 0; i < numArgs; i++) {
                const argType = instructionData[i + 2];
                const type = this.readType(argType, code, params);
                params.push(type);
            }

            instructions.push(new Instruction(instructionId, instructionData[0], params, instructionData.slice(2)));
        }

        return instructions;
    }
}
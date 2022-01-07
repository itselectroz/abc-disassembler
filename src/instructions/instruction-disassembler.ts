import { AbcFile, ExtendedBuffer, MethodBodyInfo } from "..";
import { InstructionFormatter } from "./instruction-formatter";
import { instructionMap } from "./instruction-list";

export class InstructionDisassembler {
    abcFile: AbcFile;

    constructor(abcFile: AbcFile) {
        this.abcFile = abcFile;
    }

    private readType(type: string, code: ExtendedBuffer, instruction: any[]): any {
        switch (type) {
            case "string":
                return this.abcFile.constant_pool.string[code.readUInt30() - 1];
            case "int":
                return this.abcFile.constant_pool.integer[code.readUInt30() - 1];
            case "u_int":
                return this.abcFile.constant_pool.uinteger[code.readUInt30() - 1];
            case "multiname":
                return this.abcFile.constant_pool.multiname[code.readUInt30() - 1];
            case "exception_info":
            case "class_info":
            case "namespace":
            case "method":
            case "u30":
                return code.readUInt30();

            case "offset":
            case "s24":
                return code.readInt24();

            case "u8":
                return code.readUInt8();
        }
        if (type.startsWith("array")) {
            // I think it's safe to assume that the last read value was the length of the array
            const length = instruction[instruction.length - 1];
            if (typeof length != "number") {
                throw new Error(`Expected length to be of type 'number' got type '${typeof length}'`);
            }
            const valueType = type.split('-')[1];
            const arr = [];
            for (let i = 0; i < length; i++) {
                arr.push(this.readType(valueType, code, instruction));
            }
            return arr;
        }

        throw new Error(`Unknown type '${type}'`);
    }

    disassemble(method: MethodBodyInfo) {
        const code = new ExtendedBuffer(Buffer.from(method.code));

        while (code.bytesAvailable > 0) {
            const instructionId = code.readUInt8();

            const instructionData = instructionMap[instructionId];

            const instruction = [instructionData[0]];

            const numArgs = instructionData.length - 2;

            for (let i = 0; i < numArgs; i++) {
                const argType = instructionData[i + 2];
                const type = this.readType(argType, code, instruction);
                instruction.push(type);
            }

            console.log(instruction);
        }
    }
}
// not really sure an appropriate name for this class

import { InstructionDisassembler } from ".";
import { AbcFile, ExtendedBuffer, MethodBodyInfo } from "..";
import { Instruction } from "./instruction";

export type MethodBodySignature = {
    local_count: number,
    max_stack: number,
    init_scope_depth: number,
    max_scope_depth: number,
    exception_count: number,
    trait_count: number,
    accuracy: number,

    code_signature: any[],
}

// it's essentially made for generating signatures for code
export class InstructionFinder {
    abcFile: AbcFile;

    constructor(abcFile: AbcFile) {
        this.abcFile = abcFile;

    }

    readTypeIntoSignature(type: string, param: any, instruction: Instruction, index: number, sigBytes: any[]) {
        switch (type) {
            case "string":
            case "int":
            case "u_int":
            case "multiname":
            case "exception_info":
            case "class_info":
            case "namespace":
            case "method":
            case "double":
                sigBytes.push("U30");
                break;
            case "u30":
                let value = param;
                do {
                    sigBytes.push((value & 0x7F) | (value > 0x80 ? 0x80 : 0));
                    value >>= 7;
                } while (value > 0)
                break;
            case "offset":
                sigBytes.push("?", "?", "?");
                break;
            case "s24":
                sigBytes.push(
                    param & 0xFF,
                    (param >> 8) & 0xFF,
                    (param >> 16) & 0xFF,
                );
                break;

            case "u8":
                sigBytes.push(param & 0xFF);
                break;
        }
        if (type.startsWith("array")) {
            const count = instruction.params[index - 1];
            const endIndex = ++index + count;
            while (index < endIndex) {
                index = this.readTypeIntoSignature(instruction.types[index], instruction.params[index], instruction, index, sigBytes);
                index++;
            }
        }
        return index;
    }

    generateByteSignature(method_body: MethodBodyInfo, sigLen: number = 10): any[] {
        const instructionDisassembler = new InstructionDisassembler(this.abcFile);
        const instructions = instructionDisassembler.disassemble(method_body);
        const maxSigLen = instructions.length < sigLen ? instructions.length : sigLen;

        const sigBytes: any[] = [];

        for (let i = 0; i < maxSigLen; i++) {
            const instruction = instructions[i];
            sigBytes.push(instruction.id);
            for (let i = 0; i < instruction.params.length; i++) {
                const type = instruction.types[i];
                const param = instruction.params[i];
                i = this.readTypeIntoSignature(type, param, instruction, i, sigBytes);
            }
        }

        return sigBytes;
    }

    generateMethodBodySignature(method_body: MethodBodyInfo) : MethodBodySignature{
        const bodySignature: MethodBodySignature = {
            local_count: method_body.local_count,
            max_stack: method_body.max_stack,
            init_scope_depth: method_body.init_scope_depth,
            max_scope_depth: method_body.max_scope_depth,
            exception_count: method_body.exception.length,
            trait_count: method_body.trait.length,
            accuracy: 6, // all 6 non code fields must match

            code_signature: this.generateByteSignature(method_body),
        };

        return bodySignature;
    }

    checkByteSignature(codeArray: number[], signature: any[]) {
        const code = new ExtendedBuffer(Buffer.from(codeArray));
        const sigLength = signature.length;
        if (code.bytesAvailable < sigLength) {
            return false;
        }

        for (let j = 0; j < sigLength; j++) {
            if (code.bytesAvailable < sigLength - j) {
                return false;
            }

            const byte = signature[j];
            if (byte == "?") {
                code.readUInt8();
                continue;
            }
            if (byte == "U30") {
                code.readUInt30();
                continue;
            }
            if (code.readUInt8() != byte) {
                return false;
            }
        }
        return true;
    }

    findByteSignature(signature: any[], count: boolean = false): MethodBodyInfo | false | number {
        const sigLength = signature.length;
        let c = 0;
        for (let i = 0; i < this.abcFile.method_body.length; i++) {
            const method_body = this.abcFile.method_body[i];
            const success = this.checkByteSignature(method_body.code, signature);

            if (!success) {
                continue;
            }

            if (!count) {
                return method_body;
            }
            c++;
        }
        return count ? c : false;
    }

    findMethodBodySignature(signature: MethodBodySignature, count: boolean = false) : MethodBodyInfo | false | number {
        let c = 0;
        for (let i = 0; i < this.abcFile.method_body.length; i++) {
            const method_body = this.abcFile.method_body[i];

            let matches = 0;
            if(method_body.exception.length == signature.exception_count)
                matches++;
            if(method_body.init_scope_depth == signature.init_scope_depth)
                matches++;
            if(method_body.max_scope_depth == signature.max_scope_depth)
                matches++;
            if(method_body.local_count == signature.local_count)
                matches++;
            if(method_body.max_stack == signature.max_stack)
                matches++;
            if(method_body.trait.length == signature.trait_count)
                matches++;
            
            if(matches < signature.accuracy)
                continue;

            if(!this.checkByteSignature(method_body.code, signature.code_signature))
                continue;

            if (!count) {
                return method_body;
            }
            c++;
        }
        return count ? c : false;
    }
}
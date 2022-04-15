import { InstructionDisassembler } from ".";
import { AbcFile, ExtendedBuffer, MethodBodyInfo, MultinameInfo, TraitMethod } from "..";
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
};

export type InstructionParameterReference = {
    instruction: number;
    parameter: number;
}

export type InstructionParameterSignature = {
    methodSignature: MethodBodySignature;
    instructionReference: InstructionParameterReference;
}

export type InstructionParameterSignatureResult = {
    success: boolean;
    value: any;
}

// not really sure an appropriate name for this class
// it's essentially made for generating signatures for code
export class InstructionFinder {
    get abcFile() {
        return this._abcFile;
    }

    set abcFile(value: AbcFile) {
        this._abcFile = value;
        this.disassembler = new InstructionDisassembler(this._abcFile);
    }

    private _abcFile: AbcFile;
    private disassembler: InstructionDisassembler;

    constructor(abcFile: AbcFile) {
        this._abcFile = abcFile;
        this.disassembler = new InstructionDisassembler(abcFile);
    }

    checkMethodForMultinameReference(method_body: MethodBodyInfo, multiname: MultinameInfo) : boolean {
        // future me; check traits, params, etc

        const code = this.disassembler.disassemble(method_body);
        for(const instruction of code) {
            if(instruction.types.includes("multiname")) {
                for(let i = 0; i < instruction.types.length; i++) {
                    if(instruction.types[i] != "multiname") {
                        continue;
                    }

                    if(instruction.params[i] == multiname) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    xrefMultinameMethods(multiname: MultinameInfo) : MethodBodyInfo[] {
        const method_bodies = this.abcFile.method_body.filter(v => this.checkMethodForMultinameReference(v, multiname));

        return method_bodies;
    }

    findMultinameInstructionReference(method_body: MethodBodyInfo, multiname: MultinameInfo) : InstructionParameterReference {
        // the name is quite unclear but this function finds the instruction offset at which the given multiname is referenced
        const code = this.disassembler.disassemble(method_body);
        for(let i = 0; i < code.length; i++) {
            const instruction = code[i];
            if(instruction.types.includes("multiname")) {
                for(let j = 0; j < instruction.types.length; j++) {
                    if(instruction.types[j] != "multiname") {
                        continue;
                    }

                    if(instruction.params[j] == multiname) {
                        return {
                            instruction: i,
                            parameter: j
                        };
                    }
                }
            }
        }

        return {
            instruction: -1,
            parameter: -1
        };
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
        if (type.startsWith("array1")) {
            const count = instruction.params[index - 1] + 1;
            const endIndex = ++index + count;
            while (index < endIndex) {
                index = this.readTypeIntoSignature(type.substring("array1-".length), instruction.params[index], instruction, index, sigBytes);
                index++;
            }
        }
        if (type.startsWith("array")) {
            const count = instruction.params[index - 1];
            const endIndex = ++index + count;
            while (index < endIndex) {
                index = this.readTypeIntoSignature(type.substring("array-".length), instruction.params[index], instruction, index, sigBytes);
                index++;
            }
        }
        return index;
    }

    generateByteSignature(method_body: MethodBodyInfo, sigLen: number = 10): any[] {
        const instructions = this.disassembler.disassemble(method_body);
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

    generateMethodBodySignature(method_body: MethodBodyInfo, sigLen: number = 10) : MethodBodySignature{
        const bodySignature: MethodBodySignature = {
            local_count: method_body.local_count,
            max_stack: method_body.max_stack,
            init_scope_depth: method_body.init_scope_depth,
            max_scope_depth: method_body.max_scope_depth,
            exception_count: method_body.exception.length,
            trait_count: method_body.trait.length,
            accuracy: 6, // all 6 non code fields must match

            code_signature: this.generateByteSignature(method_body, sigLen),
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

    generateInstructionParameterSignature(multiname: MultinameInfo, sigLen: number = 10) : InstructionParameterSignature | false {
        const references = this.xrefMultinameMethods(multiname);
        if(references.length == 0) {
            return false;
        }
        const longestMethods = references.sort((a,b) => b.code.length - a.code.length);
        let longestMethodIndex = Math.floor(longestMethods.length / 2);
        let longestMethod = longestMethods[longestMethodIndex];
        let methodSignature = this.generateMethodBodySignature(longestMethod, sigLen);
        
        while(this.findMethodBodySignature(methodSignature, true) > 1) {
            if(longestMethodIndex == longestMethods.length - 1) {
                return false;
            }
            longestMethods.splice(longestMethodIndex, 1);
            longestMethodIndex = Math.floor(longestMethods.length / 2);
            longestMethod = longestMethods[longestMethodIndex];
            methodSignature = this.generateMethodBodySignature(longestMethod, sigLen);
        }

        const instructionReference = this.findMultinameInstructionReference(longestMethod, multiname);
        
        if(instructionReference.instruction == -1) {
            // NOTE: I should probably just pop from the array and try again...
            return false;
        }

        return {
            methodSignature,
            instructionReference
        };
    }

    findInstructionParameterSignature(signature: InstructionParameterSignature) : InstructionParameterSignatureResult {
        const method = this.findMethodBodySignature(signature.methodSignature);
        if(method == false || typeof method == "number") {
            return {
                success: false,
                value: undefined
            }; 
        }

        const code = this.disassembler.disassemble(method);
        const instructionReference = signature.instructionReference;
        if(code.length - 1 < instructionReference.instruction) {
            return {
                success: false,
                value: undefined
            }; 
        }

        const instruction = code[instructionReference.instruction];

        if(instruction.params.length - 1 < instructionReference.parameter) {
            return {
                success: false,
                value: undefined
            };
        }

        const value = instruction.params[instructionReference.parameter];

        return {
            success: true,
            value
        };
    }
}
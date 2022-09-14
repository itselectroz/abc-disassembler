import {
    AbcFile,
    ExtendedBuffer,
    MethodBodyInfo
} from "..";
import { Instruction } from "./instruction";
import { instructionMap } from "./instruction-list";

export class InstructionDisassembler {
  abcFile: AbcFile;

  constructor(abcFile: AbcFile) {
    this.abcFile = abcFile;
  }

  private readType(type: string, code: ExtendedBuffer, params: any[]): any {
    switch (type) {
      case "string":
        const stringIndex = code.readUInt30();
        return [
          stringIndex,
          this.abcFile.constant_pool.string[stringIndex - 1],
        ];
      case "int":
        const intIndex = code.readUInt30();
        return [intIndex, this.abcFile.constant_pool.integer[intIndex - 1]];
      case "u_int":
        const u_intIndex = code.readUInt30();
        return [
          u_intIndex,
          this.abcFile.constant_pool.uinteger[u_intIndex - 1],
        ];
      case "multiname":
        const multinameIndex = code.readUInt30();
        return [
          multinameIndex,
          this.abcFile.constant_pool.multiname[multinameIndex - 1],
        ];
      case "double":
        const doubleIndex = code.readUInt30();
        return [
          doubleIndex,
          this.abcFile.constant_pool.double[doubleIndex - 1],
        ];
      case "namespace":
        const namespaceIndex = code.readUInt30();
        return [
          namespaceIndex,
          this.abcFile.constant_pool.namespace[namespaceIndex - 1],
        ];
      case "exception_info":
      case "class_info":
      case "method":
      case "u30":
        const u30Index = code.readUInt30();
        return [u30Index, u30Index];

      case "offset":
      case "s24":
        const s24Index = code.readInt24();
        return [s24Index, s24Index];

      case "u8":
        const u8Index = code.readUInt8();
        return [u8Index, u8Index];
    }
    if (type.startsWith("array1")) {
      // Same as array, but + 1 on the length.
      const length = params[params.length - 1] + 1;
      if (typeof length != "number") {
        throw new Error(
          `Expected length to be of type 'number' got type '${typeof length}'`
        );
      }
      const valueType = type.split("-")[1];
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
        throw new Error(
          `Expected length to be of type 'number' got type '${typeof length}'`
        );
      }
      const valueType = type.split("-")[1];
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

      const params: any[] = [];
      const rawParams: any[] = [];
      const numArgs = instructionData.length - 2;

      for (let i = 0; i < numArgs; i++) {
        const argType = instructionData[i + 2];
        if (argType.startsWith("array")) {
          params.push(this.readType(argType, code, params));
          rawParams.push("array");
        } else {
          const [raw, type] = this.readType(argType, code, params);
          params.push(type);
          rawParams.push(raw);
        }
      }

      instructions.push(
        new Instruction(
          instructionId,
          instructionData[0],
          params,
          rawParams,
          instructionData.slice(2)
        )
      );
    }

    return instructions;
  }
}

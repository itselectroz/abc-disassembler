export class ExtendedBuffer {
    data: Buffer;

    offset: number = 0;

    constructor(data?: Buffer) {
        if(data == undefined) {
            data = Buffer.alloc(0);
        }

        this.data = data;
    }

    skipBytes(amount: number) {
        this.offset += amount;
    }

    readBytes(amount: number) {
        this.offset += amount;
        return this.data.slice(this.offset - amount, this.offset);
    }

    readUInt8() {
        return this.data.readUInt8(this.offset++);
    }

    readUInt16() {
        const offset = this.offset;
        this.offset += 2;
        return this.data.readUInt16LE(offset);
    }

    readInt24() {
        const offset = this.offset;
        this.offset += 3;
        return this.data.readIntLE(offset, 3);
    }

    readUInt30() {
        return this.readUInt32() & 0x3FFFFFFF;
    }

    readUInt32() {
        const offset = this.offset;
        let value = 0;
        let bytes = 0;
        let pos = 0;
        let hasNextByte;
        do {
            let byte = this.readUInt8();

            hasNextByte = (byte >> 7) == 1;
            byte &= 0x7F;

            value |= byte << pos;
            
            bytes++;
            pos += 7;
        } while(hasNextByte && bytes < 5)

        return value;
    }

    readInt32() {
        let value = this.readUInt32();
        if((value >> 31) == 1) {
            value = -(value & 0x7fffffff);
        }
        return value;
    }

    readDouble() {
        const offset = this.offset;
        this.offset += 8;
        return this.data.readDoubleLE(offset);
    }

    readUTFString() {
        const length = this.readUInt30();
        return this.readBytes(length).toString('utf-8');
    }

    writeBytes(bytes: Buffer) {
        for(let i = 0; i < bytes.length; i++) {
            this.writeUInt8(bytes[i]);
        }
    }

    writeUInt8(value: number) {
        this.data.writeUInt8(value, this.offset++);
    }

    writeUInt16(value: number) {
        const offset = this.offset;
        this.offset += 2;
        return this.data.writeUInt16LE(value, offset);
    }

    writeInt24(value: number) {
        const offset = this.offset;
        this.offset += 3;
        return this.data.writeIntLE(value, offset, 3);
    }

    writeUInt30(value: number) {
        return this.writeUInt32(value & 0x3FFFFFFF);
    }

    writeUInt32(value: number) {
        value &= 0xFFFFFFFF;

        while(true) {
            let toWrite = value & 0x7F;
            if(value > 0x7F) {
                toWrite |= 0x80;
            }

            this.writeUInt8(toWrite);

            if(value < 0x80) {
                break;
            }

            value >>= 7;
        }
    }

    writeInt32(value: number) {
        const negative = value < 0;
        
        let byte = 0;
        while(byte < 5) {
            let toWrite = value & 0x7F;
            if(value > 0x7F || negative) {
                toWrite |= 0x80;
            }

            if(byte == 4) { // last byte
                toWrite &= 0xF;
            }

            this.writeUInt8(toWrite);

            if(value < 0x80 && !negative) {
                break;
            }
            
            value >>= 7;
            byte++;
        }
    }

    writeDouble(value: number) {
        const offset = this.offset;
        this.offset += 8;
        return this.data.writeDoubleLE(value, offset);
    }
    
    writeUTFString(value: string) {
        this.writeUInt30(value.length);
        for(let i = 0; i < value.length; i++) {
            this.writeUInt8(value.charCodeAt(i));
        }
    }
}
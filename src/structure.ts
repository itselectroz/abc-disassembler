import ExtendedBuffer from "./extended-buffer";

export class Structure {
    static ID: number = -1;

    get id() {
        return (this.constructor as any).ID;
    }

    send: boolean = true;

    static read(data: ExtendedBuffer) : Structure {
        return new Structure();
    }

    write(data: ExtendedBuffer) : void {

    }
}
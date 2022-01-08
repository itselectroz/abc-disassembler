export class Instruction {
    id: number;
    name: string;
    params: any[];
    types: string[];

    constructor(id: number, name: string, params: any[], types: string[]) {
        this.id = id;
        this.name = name;
        this.params = params;
        this.types = types;
    }
}
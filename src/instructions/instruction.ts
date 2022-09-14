export class Instruction {
  id: number;
  name: string;
  params: any[];
  rawParams: any[];
  types: string[];

  constructor(
    id: number,
    name: string,
    params: any[],
    rawParams: any[],
    types: string[]
  ) {
    this.id = id;
    this.name = name;
    this.params = params;
    this.rawParams = rawParams;
    this.types = types;
  }
}

import { AbcFile, MultinameInfo, MultinameKind, MultinameKindMultiname, MultinameKindMultinameL, MultinameKindQName, MultinameKindRTQName, MultinameKindTypeName, NamespaceInfo, NamespaceKind, NSSetInfo } from "..";

export class InstructionFormatter {
    abcFile: AbcFile;

    constructor(abcFile: AbcFile) {
        this.abcFile = abcFile;
    }

    formatNamespaceInfo(namespace: NamespaceInfo) {
        const constants = this.abcFile.constant_pool;
        const typeName = NamespaceKind[namespace.kind];
        const name = namespace.name == 0 ? "" : constants.string[namespace.name - 1];
        let subNamespaceIndex = 0;
        for(let i = 0; i < constants.namespace.length; i++) {
            const comparisonNS = constants.namespace[i];
            if(comparisonNS.kind == namespace.kind && comparisonNS.name == namespace.name) {
                if(comparisonNS === namespace) {
                    break;
                }
                subNamespaceIndex++;
            }
        }

        const subNamespaceString = subNamespaceIndex > 0 ? `, "${subNamespaceIndex}"` : "";
        return `${typeName}("${name}"${subNamespaceString})`;
    }

    formatNamespaceSet(namespaceSet: NSSetInfo) {
        let str = "[";

        for(const nsIndex of namespaceSet.ns) {
            const namespace = this.abcFile.constant_pool.namespace[nsIndex - 1];
            str += this.formatNamespaceInfo(namespace) + ",";
        }

        return str.substring(0, str.length - 1) + "]";
    }

    formatMultinameInfo(multiname: MultinameInfo): string {
        const constants = this.abcFile.constant_pool;
        const typeName = MultinameKind[multiname.kind];
        switch (multiname.kind) {
            case MultinameKind.QName:
            case MultinameKind.QNameA: {
                const qnameData = multiname.data as MultinameKindQName;
                const name = qnameData.name == 0 ? "" : constants.string[qnameData.name - 1];
                const namespace = qnameData.ns == 0 ? null : constants.namespace[qnameData.ns - 1];
                
                return `${typeName}(${!!namespace ? this.formatNamespaceInfo(namespace) : "\"null\""}, \"${name}\")`
            }

            case MultinameKind.RTQName:
            case MultinameKind.RTQNameA: {
                const rtQNameData = multiname.data as MultinameKindRTQName;
                const name = rtQNameData.name == 0 ? "" : constants.string[rtQNameData.name - 1];
                return `${typeName}(\"${name}\")`;
            }

            case MultinameKind.RTQNameL:
            case MultinameKind.RTQNameLA:

                return `${typeName}()`;

            case MultinameKind.Multiname:
            case MultinameKind.MultinameA: {
                const multinameData = multiname.data as MultinameKindMultiname;
                const name = multinameData.name == 0 ? "" : constants.string[multinameData.name - 1];
                const nsInfo = constants.ns_set[multinameData.ns_set - 1];
                return `${typeName}("${name}", ${this.formatNamespaceSet(nsInfo)})`;
            }

            case MultinameKind.MultinameL:
            case MultinameKind.MultinameLA: {
                const multinameData = multiname.data as MultinameKindMultinameL;
                const nsInfo = constants.ns_set[multinameData.ns_set - 1];
                return `${typeName}(${this.formatNamespaceSet(nsInfo)})`;
            }

            case MultinameKind.TypeName: {
                const typenameData = multiname.data as MultinameKindTypeName;
                const baseMultiname = typenameData.qname == 0 ? null : constants.multiname[typenameData.qname - 1];
                const params = typenameData.params.map((param) => param == 0 ? null : constants.multiname[param - 1]);
                const paramStrings: string[] = params.map(v => !!v ? this.formatMultinameInfo(v) : "null");
                return `${typeName}(${baseMultiname == null ? "null" : this.formatMultinameInfo(baseMultiname)}<${paramStrings.join(",")}>)`;
            }

            default:
                throw new Error(`Undefined Multiname ${multiname.kind}`);
        }
    }

    formatInstruction(instruction: any[]) {
        
    }
}
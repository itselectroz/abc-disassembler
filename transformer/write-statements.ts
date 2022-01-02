import * as ts from 'typescript';
import { createUniqueName } from '.';
import { Constant, CustomData, OptionalData, TypeData, VectorData } from './transformer-types';

const factory = ts.factory;

// Credits to https://ts-ast-viewer.com/ for the help with this code. Complete lifesaver.

function getWriteFunctionName(type: string): string | false {
    switch (type) {
        case "string":
            return "writeUTFString";
        case "u8":
            return "writeUInt8";
        case "u16":
            return "writeUInt16";
        case "s24":
            return "writeInt24";
        case "u30":
            return "writeUInt30";
        case "u32":
            return "writeUInt32";
        case "s32":
            return "writeInt32";
        case "d64":
            return "writeDouble";
        default:
            return false;
    }
}

export function createWriteStatement(typeData: TypeData, expression: ts.Expression): ts.Statement[] {
    const type = typeData.type;

    switch (type) {
        case "constant":
            throw new Error("Unable to write constants.");

        case "vector": {
            const vectorIdentifier = createUniqueName("vectorValue");

            const statements: ts.Statement[] = [
                factory.createVariableStatement(
                    undefined,
                    factory.createVariableDeclarationList(
                        [
                            factory.createVariableDeclaration(
                                vectorIdentifier,
                                undefined,
                                undefined,
                                expression
                            )
                        ],
                        ts.NodeFlags.Const
                    )
                )
            ];

            const vectorData: VectorData = typeData.data;

            const lengthType = vectorData.lengthType;
            const valueType = vectorData.valueType;

            let lessThanExpression: ts.Expression;

            if (lengthType.type == "constant") {
                // Length doesn't need to be written
                const constant = lengthType.data as Constant;

                if (constant.type == "string") {
                    lessThanExpression = factory.createPropertyAccessExpression(
                        factory.createThis(),
                        constant.value
                    );
                }
                else if (constant.type == "number") {
                    lessThanExpression = factory.createNumericLiteral(constant.value)
                }
                else {
                    throw new SyntaxError(`Expected string or number constant in vector length, got '${constant.type}'`);
                }
            }
            else {
                // Length needs to be written to the buffer
                const vectorLengthIdentifier = createUniqueName("vectorLength");

                const writeLengthFunctionName = getWriteFunctionName(lengthType.type);

                if (!writeLengthFunctionName) {
                    throw new SyntaxError(`Invalid length type for vector, got '${lengthType.type}'`);
                }

                statements.push(
                    factory.createVariableStatement(
                        undefined,
                        factory.createVariableDeclarationList(
                            [
                                factory.createVariableDeclaration(
                                    vectorLengthIdentifier,
                                    undefined,
                                    undefined,
                                    factory.createPropertyAccessExpression(
                                        vectorIdentifier,
                                        "length"
                                    )
                                )
                            ],
                            ts.NodeFlags.Const
                        )
                    ),
                    factory.createExpressionStatement(
                        factory.createCallExpression(
                            factory.createPropertyAccessExpression(
                                factory.createIdentifier("buffer"),
                                writeLengthFunctionName
                            ),
                            undefined,
                            [
                                vectorLengthIdentifier
                            ]
                        )
                    )
                );

                lessThanExpression = vectorLengthIdentifier;
            }

            const uniqueIndexName = createUniqueName("i");

            statements.push(
                factory.createForStatement(
                    factory.createVariableDeclarationList([
                        factory.createVariableDeclaration(
                            uniqueIndexName,
                            undefined,
                            undefined,
                            factory.createNumericLiteral(0)
                        )
                    ]),
                    factory.createBinaryExpression(
                        uniqueIndexName,
                        factory.createToken(ts.SyntaxKind.LessThanToken),
                        lessThanExpression
                    ),
                    factory.createPostfixIncrement(
                        uniqueIndexName
                    ),
                    factory.createBlock(
                        createWriteStatement(
                            valueType,
                            factory.createElementAccessExpression(
                                vectorIdentifier,
                                uniqueIndexName
                            )
                        )
                    )
                )
            )

            return statements;
        }

        case "optional": {
            const optionalData: OptionalData = typeData.data;
            
            return [
                factory.createIfStatement(
                    factory.createCallExpression(
                        factory.createPropertyAccessExpression(
                            factory.createThis(),
                            optionalData.comparisonName
                        ),
                        undefined,
                        []
                    ),
                    factory.createBlock(createWriteStatement(optionalData.valueType, expression), false),
                    undefined
                )
            ];
        }

        case "custom": {
            return [
                factory.createExpressionStatement(
                    factory.createCallExpression(
                        factory.createPropertyAccessExpression(
                            expression,
                            factory.createIdentifier("write")
                        ),
                        undefined,
                        [
                            factory.createIdentifier("buffer")
                        ]
                    )
                )
            ];
        }

        default: {
            const functionName = getWriteFunctionName(type);

            if (!functionName) {
                throw new Error(`Cannot get function name for type ${type}`);
            }

            return [
                factory.createExpressionStatement(
                    factory.createCallExpression(
                        factory.createPropertyAccessExpression(
                            factory.createIdentifier("buffer"),
                            factory.createIdentifier(functionName)
                        ),
                        undefined,
                        [
                            expression
                        ]
                    )
                )
            ];
        }
    }
}

// Creates the write method
/*
    write(buffer: any) {
        --- statements ---
    }
*/
export function createWriteFunction(statements: ts.Statement[]) {
    return factory.createMethodDeclaration(
        undefined,
        undefined,
        undefined,
        factory.createIdentifier("write"),
        undefined,
        undefined,
        [factory.createParameterDeclaration(
            undefined,
            undefined,
            undefined,
            factory.createIdentifier("buffer"),
            undefined,
            factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
            undefined
        )],
        undefined,
        factory.createBlock(
            statements,
            true
        )
    )
}
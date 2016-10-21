import {CommandInputParameterModel} from "./CommandInputParameterModel";
import {expect} from "chai";
import {CommandLinePart} from "../helpers/CommandLinePart";

describe("CommandInputParameterModel v1", () => {
    describe("constructor", () => {
        it("should assign required field", () => {
            let input = new CommandInputParameterModel({
                id: "input",
                type: ["string"]
            });
            expect(input.isRequired).to.be.true;
        });

        it("should assign non required field", () => {
            let input = new CommandInputParameterModel({
                id: "input",
                type: ["null", "string"]
            });
            expect(input.isRequired).to.be.false;
        });

        it("Should assign input type array, items record", () => {
            let input = new CommandInputParameterModel({
                id: "input",
                type: {
                    type: "array",
                    items: {
                        type: "record",
                        fields: [
                            {
                                name: "field1",
                                type: "string"
                            }
                        ]
                    }
                }
            });

            expect(input.resolvedType).to.equal('array');
            expect(input.items).to.equal('record');
            expect(input.fields).to.have.length(1);
        });


        it("Should assign input type array, items string", () => {
            let input = new CommandInputParameterModel({
                id: "input",
                type: {
                    type: "array",
                    items: "string"
                }
            });

            expect(input.resolvedType).to.equal('array');
            expect(input.items).to.equal('string');
        });

    });

    describe("getCommandLinePart", () => {

        it("Should return null if input has no inputBinding", () => {
            let input = new CommandInputParameterModel({type: "string", id: "test1"});
            expect(input.getCommandPart()).to.be.null;
        });

        it("Should throw exception if value and input type mismatch", () => {
            let input = new CommandInputParameterModel({
                type: "string",
                id: "test1",
                inputBinding: {}
            });
            expect(function () {
                input.getCommandPart({}, 3);
            }).to.throw("Mismatched value and type definition");
        });

        it("Should evaluateV1 a string value without prefix", () => {
            let input = new CommandInputParameterModel({
                type: "string",
                id: "test1",
                inputBinding: {}
            });
            let part  = input.getCommandPart({}, "test");
            expect(part).to.have.property("value");
            expect((<CommandLinePart> part).value).to.equal("test");
        });

        it("Should evaluateV1 an int value without prefix", () => {
            let input = new CommandInputParameterModel({
                type: "int",
                id: "test1",
                inputBinding: {}
            });
            let part  = input.getCommandPart({}, 3);
            expect(part).to.have.property("value");
            expect((<CommandLinePart> part).value).to.equal('3');
        });

        it("Should evaluateV1 an float value without prefix", () => {
            let input = new CommandInputParameterModel({
                type: "float",
                id: "test1",
                inputBinding: {}
            });
            let part  = input.getCommandPart({}, 33.3);
            expect(part).to.have.property("value");
            expect((<CommandLinePart> part).value).to.equal('33.3');
            expect((<CommandLinePart> part).sortingKey).to.have.length(1);
        });

        it("Should evaluateV1 double value with prefix", () => {
            let input = new CommandInputParameterModel({
                type: "double",
                id: "test1",
                inputBinding: {prefix: '-g'}
            });
            let part  = input.getCommandPart({}, 33.3);
            expect(part).to.have.property("value");
            expect((<CommandLinePart> part).value).to.equal('-g 33.3');
            expect((<CommandLinePart> part).sortingKey).to.have.length(1);
        });

        /**
         * ARRAYS
         */
        it("Should evaluateV1 an array of strings", () => {
            let input = new CommandInputParameterModel({
                type: "string[]",
                id: "test1",
                inputBinding: {}
            });
            let part  = input.getCommandPart({}, ["one", "two", "three"]);
            expect(part).to.have.property("value");
            expect((<CommandLinePart> part).value).to.equal("one two three");
            expect((<CommandLinePart> part).sortingKey).to.have.length(1);
        });

        it("Should evaluateV1 an array of strings with a prefix", () => {
            let input = new CommandInputParameterModel({
                type: "string[]",
                id: "test1",
                inputBinding: {prefix: "p-"}
            });
            let part  = input.getCommandPart({}, ["one", "two", "three"]);
            expect(part).to.have.property("value");
            expect((<CommandLinePart> part).value).to.equal("p- one p- two p- three");
            expect((<CommandLinePart> part).sortingKey).to.have.length(1);
        });

        it("Should evaluateV1 an array of strings with a prefix and separate == false", () => {
            let input = new CommandInputParameterModel({
                type: "string[]",
                id: "test1",
                inputBinding: {prefix: "p-", separate: false}
            });
            let part  = input.getCommandPart({}, ["one", "two", "three"]);
            expect(part).to.have.property("value");
            expect((<CommandLinePart> part).value).to.equal("p-one p-two p-three");
            expect((<CommandLinePart> part).sortingKey).to.have.length(1);
        });

        it("Should evaluateV1 an array of strings with a prefix and itemSeparator", () => {
            let input = new CommandInputParameterModel({
                type: "string[]",
                id: "test1",
                inputBinding: {prefix: "p-", itemSeparator: ','}
            });
            let part  = input.getCommandPart({}, ["one", "two", "three"]);
            expect(part).to.have.property("value");
            expect((<CommandLinePart> part).value).to.equal("p- one, two, three");
            expect((<CommandLinePart> part).sortingKey).to.have.length(1);
        });

        it("Should evaluateV1 an array of files with prefix and separator", () => {
            let input = new CommandInputParameterModel({
                type: "File[]",
                id: "test1",
                inputBinding: {prefix: "p-", itemSeparator: ','}
            });
            let part  = input.getCommandPart({}, [{path: "one.txt"}, {path: "two.txt"}, {path: "three.txt"}]);
            expect(part).to.have.property("value");
            expect((<CommandLinePart> part).value).to.equal("p- one.txt, two.txt, three.txt");
            expect((<CommandLinePart> part).sortingKey).to.have.length(1);
        });

        /**
         * PRIMITIVE WITH PREFIX
         */
        it("Should evaluateV1 a primitive type with a prefix", () => {
            let input = new CommandInputParameterModel({
                type: "int",
                id: "test1",
                inputBinding: {prefix: "p-"}
            });
            let part  = input.getCommandPart({}, 44);
            expect(part).to.have.property("value");
            expect((<CommandLinePart> part).value).to.equal("p- 44");
        });

        it("Should evaluateV1 a File type", () => {
            let input = new CommandInputParameterModel({
                type: "File",
                id: "test1",
                inputBinding: {prefix: '-o'}
            });
            let part  = input.getCommandPart({}, {path: "path/to/file", class: "File"});
            expect(part).to.have.property("value");
            expect((<CommandLinePart> part).value).to.equal("-o path/to/file");
        });


        /**
         * RECORDS
         */
        it("Should evaluateV1 record with fields", () => {
            let input = new CommandInputParameterModel({
                type: {
                    type: "record", fields: [
                        {
                            type: "string",
                            name: "rec_string",
                            inputBinding: {position: 2, prefix: '-b'}
                        },
                        {
                            type: "int",
                            name: "rec_int",
                            inputBinding: {position: 0, prefix: '-o'}
                        }
                    ]
                },
                id: "test1",
                inputBinding: {position: 2}
            });

            let part = input.getCommandPart({}, {rec_string: "baz", rec_int: 6});

            expect(part).to.have.property("value");
            expect(part.value).to.equal("-o 6 -b baz");
        });


        it("Should evaluateV1 record with fields type File array", () => {
            let input = new CommandInputParameterModel({
                type: {
                    type: "record",
                    fields: [
                        {
                            type: "File[]",
                            name: "rec_file_arr",
                            inputBinding: {position: 2, prefix: '-f', itemSeparator: ","}
                        },
                        {
                            type: "int",
                            name: "rec_int",
                            inputBinding: {position: 0, prefix: '-o'}
                        }
                    ]
                },
                id: "test1",
                inputBinding: {position: 2}
            });

            let part = input.getCommandPart({}, {
                rec_file_arr: [{path: "one.txt"}, {path: "two.txt"}, {path: "three.txt"}],
                rec_int: 6
            });

            expect(part).to.have.property("value");
            expect(part.value).to.equal("-o 6 -f one.txt, two.txt, three.txt");
        });

        //@todo: break this down into multiple tests, nested records are tricky
        it("Should evaluated a nested record", () => {
            let input = new CommandInputParameterModel({
                type: {
                    type: "record",
                    fields: [
                        {
                            type: {
                                type: "record",
                                fields: [
                                    {
                                        type: "int",
                                        name: "rec_int",
                                        inputBinding: {position: 0, prefix: '-o'}
                                    },
                                    {
                                        type: "string",
                                        name: "rec_string",
                                        inputBinding: {}
                                    }
                                ]
                            },
                            name: "nested_rec",
                            inputBinding: {position: 2}
                        },
                        {
                            type: "string",
                            name: "outside_nested",
                            inputBinding: {}
                        }
                    ]
                },
                id: "root",
                inputBinding: {position: 2}
            });

            let part = input.getCommandPart({}, {
                nested_rec: {
                    rec_int: 6,
                    rec_string: "boo"
                },
                outside_nested: "foo"
            });

            expect(part).to.have.property("value");
            expect(part.value).to.equal("foo -o 6 boo");
        });

        it("should evaluateV1 inputBinding valueFrom that is a string", () => {
            const input = new CommandInputParameterModel({
                type: "int",
                id: "test1",
                inputBinding: {prefix: "p-", valueFrom: "value"}
            });

            const part = input.getCommandPart({}, 34);

            expect(part).to.have.property("value");
            expect(part.value).to.equal("p- value");
        });

        it("should evaluateV1 inputBinding valueFrom that is an expression", () => {
            const input = new CommandInputParameterModel({
                type: "int",
                id: "test1",
                inputBinding: {prefix: "p-", valueFrom: "$(3+2)"}
            });

            const part = input.getCommandPart({}, 34);

            expect(part).to.have.property("value");
            expect(part.value).to.equal("p- 5");
        });

        it("should evaluateV1 inputBinding valueFrom that is a function", () => {
            const input = new CommandInputParameterModel({
                type: "int",
                id: "test1",
                inputBinding: {prefix: "p-", valueFrom: "${return 3+7}"}
            });

            const part = input.getCommandPart({}, 34);

            expect(part).to.have.property("value");
            expect(part.value).to.equal("p- 10");
        });


        it("should evaluateV1 inputBinding valueFrom that references inputs", () => {
            const input = new CommandInputParameterModel({
                type: "int",
                id: "test1",
                inputBinding: {prefix: "p-", valueFrom: "$(inputs.test1 + inputs.test2)"}
            });

            const part = input.getCommandPart({test1: 34, test2: 55}, 34);

            expect(part).to.have.property("value");
            expect(part.value).to.equal("p- 89");
        });

        it("should evaluateV1 inputBinding valueFrom that references self", () => {
            const input = new CommandInputParameterModel({
                type: "int",
                id: "test1",
                inputBinding: {prefix: "p-", valueFrom: "$(++self)"}
            });

            const part = input.getCommandPart({test1: 34, test2: 55}, 34);

            expect(part).to.have.property("value");
            expect(part.value).to.equal("p- 35");
        });
    });
});
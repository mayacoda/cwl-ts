import {ExpressionEvaluator} from "./ExpressionEvaluator";
import {expect} from "chai";

describe("ExpressionEvaluator", () => {
    const expressionEvaluator = new ExpressionEvaluator();

    describe("grabExpressions", () => {
        it("should push only token for string literal", () => {
            let tokens = expressionEvaluator.grabExpressions("this is just a string");
            expect(tokens).to.have.length(1);
            expect(tokens[0].value).to.equal("this is just a string");
            expect(tokens[0].type).to.equal("literal");
        });

        it("should push token for string literal if it doesn't have correct syntax for expr or func", () => {
            let tokens = expressionEvaluator.grabExpressions("this is $ ( still just a string");
            expect(tokens).to.have.length(1);
            expect(tokens[0].value).to.equal("this is $ ( still just a string");
            expect(tokens[0].type).to.equal("literal");
        });

        it("should grab a expression", () => {
            let tokens = expressionEvaluator.grabExpressions("string $(22)");
            expect(tokens).to.have.length(2);
            expect(tokens[0].value).to.equal("string ");
            expect(tokens[0].type).to.equal("literal");

            expect(tokens[1].value).to.equal("22");
            expect(tokens[1].type).to.equal("expr");
        });

        it("should grab an expression with string literal", () => {
            let tokens = expressionEvaluator.grabExpressions("string ${22}");
            expect(tokens).to.have.length(2);
            expect(tokens[0].value).to.equal("string ");
            expect(tokens[0].type).to.equal("literal");

            expect(tokens[1].value).to.equal("22");
            expect(tokens[1].type).to.equal("func");
        });

        it("should grab a single expression", () => {
            let tokens = expressionEvaluator.grabExpressions("${43}");
            expect(tokens).to.have.length(1);
            expect(tokens[0].value).to.equal("43");
            expect(tokens[0].type).to.equal("func");
        });


        it("should grab two functions", () => {
            let tokens = expressionEvaluator.grabExpressions("${43}${22}");
            expect(tokens).to.have.length(2);
            expect(tokens[0].value).to.equal("43");
            expect(tokens[0].type).to.equal("func");

            expect(tokens[1].value).to.equal("22");
            expect(tokens[1].type).to.equal("func");
        });

        it("should grab a expression with string literal", () => {
            let tokens = expressionEvaluator.grabExpressions("string $(22)");
            expect(tokens).to.have.length(2);
            expect(tokens[0].value).to.equal("string ");
            expect(tokens[0].type).to.equal("literal");

            expect(tokens[1].value).to.equal("22");
            expect(tokens[1].type).to.equal("expr");
        });

        it("should grab two expressions", () => {
            let tokens = expressionEvaluator.grabExpressions("$(43)$(22)");
            expect(tokens).to.have.length(2);
            expect(tokens[0].value).to.equal("43");
            expect(tokens[0].type).to.equal("expr");

            expect(tokens[1].value).to.equal("22");
            expect(tokens[1].type).to.equal("expr");
        });

        it("should be able to evaluateV1 a nested expression", () => {
            let tokens = expressionEvaluator.grabExpressions("${if (true) {return false;}}");
            expect(tokens).to.have.length(1);
            expect(tokens[0].value).to.equal("if (true) {return false;}");
            expect(tokens[0].type).to.equal("func");
        });

        it("should be able to evaluateV1 a nested expression", () => {
            let tokens = expressionEvaluator.grabExpressions("$(function() {if (true) {return false;}})");

            expect(tokens).to.have.length(1);
            expect(tokens[0].value).to.equal("function() {if (true) {return false;}}");
            expect(tokens[0].type).to.equal("expr");
        });

        it("should thrown an exception for improperly written expression", () => {
            expect(expressionEvaluator.grabExpressions.bind(null, "$(function() {if (true) {return false;}}")).to.throw("Invalid expression");
        });

        it("should allow for dollar signs if they're escaped", () => {
            let tokens = expressionEvaluator.grabExpressions("\\${ escaped");

            expect(tokens).to.have.length(1);
            expect(tokens[0].value).to.equal("\\${ escaped");
            expect(tokens[0].type).to.equal("literal");
        });
    });

    describe("evaluateV1", () => {
        it("should evaluateV1 a string", () => {
            expect(expressionEvaluator.evaluateV1("hello world")).to.equal("hello world");
        });

        it("should evaluateV1 3 + 3 expression", () => {
            expect(expressionEvaluator.evaluateV1("$(3 + 3)")).to.equal(6);
        });

        it("should evaluateV1 3 + 7 function", () => {
            expect(expressionEvaluator.evaluateV1("${return 3 + 7;}")).to.equal(10);
        });

        it("should concat values of two expressions", () => {
            expect(expressionEvaluator.evaluateV1("$(3 + 3)$(9 + 1)")).to.equal("610");
        });

        it("should concat value of expression and literal", () => {
            expect(expressionEvaluator.evaluateV1("$(3 + 3) + 3")).to.equal("6 + 3");
        });

        it("should concat value of function and literal", () => {
            expect(expressionEvaluator.evaluateV1("$(3 + 3) + ${ return 5}")).to.equal("6 + 5");
        });

        it("should evaluateV1 an expression with an inputs reference", () => {
            expect(expressionEvaluator.evaluateV1(
                "${ return inputs.text }",
                {text: "hello"}
                )).to.equal("hello");
        });

        it("should evaluateV1 an expression with a self reference", () => {
            expect(expressionEvaluator.evaluateV1(
                "${ return self.prop }",
                null,
                {prop: "baz"}
                )).to.equal("baz");
        });
    });

    describe("evaluateD2", () => {
        it("should evaluateV1 function body", () => {
            expect(expressionEvaluator.evaluateD2({
                class: "Expression",
                engine: "cwl-js-engine",
                script: "{ return 5 + 3; }"
            })).to.equal(8);
        });

        it("should evaluateV1 an inline expression", () => {
            expect(expressionEvaluator.evaluateD2({
                class: "Expression",
                engine: "cwl-js-engine",
                script: " 5 + 3"
            })).to.equal(8);
        });
    })
});
import {JSExecutor} from "./JSExecutor";
import {JSNodeExecutor} from "./JSNodeExecutor";
import {Expression as ExpressionD2} from "../../mappings/d2sb/Expression";
import {Expression as ExpressionV1} from "../../mappings/draft-4/Expression";

export class ExpressionEvaluator {
    executor: JSExecutor;

    constructor(executor?: JSExecutor) {
        this.executor = executor || new JSNodeExecutor();
    }

    public evaluateV1(expr: string | ExpressionV1, job?: any, self?: any): any {
        const context = {
            inputs: job,
            self: self
        };
        "${return 3 + 3} + $( 3 + 5) je neki broj";
        "6 + 8 je neki broj";

        let results = this.grabExpressions(expr).map(token => {
            switch (token.type) {
                case "func":
                    this.executor.execute("(function() {" + token.value + "})()", context, (err, res) => {
                        //???????????
                    });
                    break;
                case "expr":
                    this.executor.execute(token.value, context, (err, res) => {
                        //???????????
                    });
                    break;
                case "literal":
                    return token.value;
            }
        });

        if (results.length === 1) {
            return results[0];
        } else {
            return results.join('');
        }
    }

    public evaluateD2(expr: string | ExpressionD2, job?: any, self?: any) {
        const context = {
            $job: job,
            $self: self
        };

        if (typeof expr === "string") {
            return expr;
        } else {
            let script = expr.script.charAt(0) === '{'
                ? "(function()" + expr.script + ")()"
                : expr.script;

            this.executor.execute(script, context, (err, res) => {

            });
        }
    }

    public grabExpressions(exprStr: string): exprObj[] {
        let tokens: exprObj[] = [];
        let i                 = 0;
        let state             = State.LITERAL;
        let literal           = "";
        let expr              = "";
        let func              = "";
        let bracketCount      = 0;
        let parenCount        = 0;

        // go through character by character
        while (i < exprStr.length) {
            let currentChar = exprStr[i];

            switch (state) {
                case State.LITERAL:
                    if (currentChar === "$" && exprStr[i + 1] === "(") {
                        // start expression and push past literal
                        if (literal) {
                            tokens.push({type: "literal", value: literal});
                            literal = "";
                        }
                        i++;
                        expr  = "";
                        state = State.EXPR;

                    } else if (currentChar === "$" && exprStr[i + 1] === "{") {
                        // start expression and push past literal
                        if (literal) {
                            tokens.push({type: "literal", value: literal});
                            literal = "";
                        }
                        i++;
                        func  = "";
                        state = State.FUNC;
                    } else if (currentChar === "\\" && exprStr[i + 1] === "$") {
                        literal += "\\$";
                        i++;
                    } else {
                        literal += currentChar;
                    }
                    break;
                case State.EXPR:

                    switch (currentChar) {
                        case "(":
                            expr += currentChar;
                            parenCount++;
                            break;
                        case ")":
                            if (parenCount === 0) {
                                tokens.push({type: "expr", value: expr});
                                state = State.LITERAL;
                            } else {
                                expr += currentChar;
                                parenCount--;
                            }
                            break;
                        default:
                            expr += currentChar;
                    }
                    break;
                case State.FUNC:

                    switch (currentChar) {
                        case "{":
                            func += currentChar;
                            bracketCount++;
                            break;
                        case "}":
                            if (bracketCount === 0) {
                                tokens.push({type: "func", value: func});
                                state = State.LITERAL;
                            } else {
                                func += currentChar;
                                bracketCount--;
                            }
                            break;
                        default:
                            func += currentChar;
                            break;
                    }
                    break;
            }

            i++;
        }

        if (state === State.LITERAL && literal.length > 0) {
            tokens.push({type: "literal", value: literal});
        }

        if (state === State.EXPR || state === State.FUNC) {
            throw("Invalid expression");
        }
        return tokens;
    }
}

export interface exprObj {
    type: string;
    value: string;
}

enum State {
    LITERAL,
    FUNC,
    EXPR,
}
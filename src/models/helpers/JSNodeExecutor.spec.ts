import {JSNodeExecutor} from "./JSNodeExecutor"
import {expect} from "chai";

describe("JSNodeExecutor", () => {
    describe("execute", () => {
        it("should execute a simple expression", (done) => {
            const exec = new JSNodeExecutor();
            exec.execute("3 + 4", {}, function (err, res) {
                expect(res).to.equal(7);
                done();
            });
        });

        it("should throw a ReferenceError", (done) => {
            const exec = new JSNodeExecutor();

            exec.execute("job.json.split()", {}, function (err) {
                expect(err.constructor.name).to.equal("ReferenceError");
                done();
            });
        });

        it("should throw a TypeError", (done) => {
            const exec = new JSNodeExecutor();

            exec.execute("null.f()", {}, function (err) {
                expect(err.constructor.name).to.equal("TypeError");
                done();
            });
        });

        it("should not throw ReferenceError when referencing context", (done) => {
            const exec = new JSNodeExecutor();

            exec.execute("obj.hello", {obj: {hello: "world"}}, function (err, res) {
                if (err) {
                    done(err);
                } else {
                    expect(res).to.equal("world");
                    done();
                }
            });
        })


    })
});
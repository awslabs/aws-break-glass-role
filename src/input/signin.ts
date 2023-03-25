import { EventField, RuleTargetInput } from "aws-cdk-lib/aws-events";
import { EventInput } from "../types";
import { BreakGlassTargetInput } from "./target-input";

export class SigninTargetInput extends BreakGlassTargetInput {
    static generateTargetInput(msg?:string, additionalEvents?:EventInput): RuleTargetInput {
        // To make jsii happy
        if (additionalEvents) console.log("Has additional events");
        return (new SigninTargetInput(msg)).generateTarget();
    }

    constructor(msg?:string) {
        super(msg, {
            result: EventField.fromPath('$.detail.responseElements.ConsoleLogin'),
        })
    }
}
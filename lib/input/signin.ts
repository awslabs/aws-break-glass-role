import { EventField, RuleTargetInput } from "aws-cdk-lib/aws-events";
import { BreakGlassTargetInput } from "./target-input";

export class SigninTargetInput extends BreakGlassTargetInput {

    static getTarget(msg?:string): RuleTargetInput {
        return (new SigninTargetInput(msg)).getTarget();
    }

    constructor(msg?:string) {
        super(msg, {
            result: EventField.fromPath('$.detail.responseElements.ConsoleLogin'),
        })
    }
}
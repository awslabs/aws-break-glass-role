import { BreakGlassConstructBase } from "../util/construct-base";
import { BreakGlassLoginAlertProps } from "../types";
import { LoginAlertRule } from "../events/rules/login-alert";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { SigninTargetInput } from "../input/signin";
import { Construct } from "constructs";
import { BreakGlassRuleBase } from "../util/rule-base";


export class BreakGlassLoginAlert extends BreakGlassConstructBase {
    constructor(scope:Construct,id:string,props:BreakGlassLoginAlertProps) {
        super(scope,id,props);
    }

    protected setRule(region: string, name: string): BreakGlassRuleBase {
        return new LoginAlertRule(this.scope, name, {
            usernames: this.usernames,
            eventBus: this.eventBus,
            busRole: this.targetBusRole,
            region,
            sendLogs: this.props.createLoginLogGroup,
            retentionDays: this.props.retention || RetentionDays.THREE_MONTHS,
            role: this.role,
            mainRegion: this.mainRegion,
            targetInput: SigninTargetInput.generateTargetInput(this.props.message),
            loginAlertEmails: this.props.loginAlertEmails
        });
    }
}
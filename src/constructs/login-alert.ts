import { BreakGlassConstructBase } from "../util/construct-base";
import { BreakGlassBaseProps } from "../types";
import { LoginAlertRule } from "../events/rules/login-alert";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { SigninTargetInput } from "../input/signin";
import { Construct } from "constructs";
export interface BreakGlassLoginAlertProps extends BreakGlassBaseProps {
    loginAlertEmails?: string[]
    createLoginLogGroup?: boolean
    message?:string
}

export class BreakGlassLoginAlert extends BreakGlassConstructBase {
    constructor(scope:Construct,id:string,props:BreakGlassLoginAlertProps) {
        super(scope,id,props);
    }

    protected setRule(region: string, name: string): LoginAlertRule {
        return new LoginAlertRule(this.scope, name, {
            usernames: this.usernames,
            eventBus: this.eventBus,
            busRole: this.targetBusRole,
            region,
            sendLogs: this.props.createLoginLogGroup,
            retentionDays: this.props.retention || RetentionDays.THREE_MONTHS,
            role: this.role,
            mainRegion: this.mainRegion,
            targetInput: SigninTargetInput.getTarget(this.props.message),
            loginAlertEmails: this.props.loginAlertEmails
        });
    }
}
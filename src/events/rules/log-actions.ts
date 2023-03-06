import { EventPattern, IRuleTarget, RuleTargetInput } from "aws-cdk-lib/aws-events";
import { BreakGlassLogGroup } from "../../util/log-group";
import { Construct } from "constructs";
import { EventPatternField } from "../../types";
import { BreakGlassRuleBase, BreakGlassRuleBaseProps } from "../../util/rule-base";

export interface LogActionsRuleProps extends BreakGlassRuleBaseProps {
    logActions?: 'read' | 'write' | boolean
    logServices?: string[]
}

export class LogActionsRule extends BreakGlassRuleBase {
    readOnly: {readOnly?: EventPatternField} = {}
    eventSource: { eventSource?: EventPatternField } = {}
    constructor(
        scope: Construct, 
        id: string,
        props:LogActionsRuleProps
    ) {
        super(scope, id, props);
        if (props.logActions === 'read') this.readOnly = {readOnly:[true]};
        else if (props.logActions === 'write') this.readOnly = {readOnly:[false]};
        if (props.logServices?.length) {
            this.eventSource = {
                // TODO: Validate filter types
                eventSource: props.logServices.map(service => ({ prefix: service.toLowerCase() }))
            }
        }
        this.rule.addEventPattern(this.pattern);
    }

    protected setTargets(message:RuleTargetInput): IRuleTarget | IRuleTarget[] {
        return new BreakGlassLogGroup(this.scope,`${this.id}-log${this.targetCount}`,{
            retention: this.props.retentionDays,
            region: this.region
        })
    }

    protected setPattern(): EventPattern {
        return {
            detail: {
                ...this.readOnly,
                ...this.eventSource,
                userIdentity: {
                    arn: this.usernames.map(suffix => ({ suffix:"a" }))
                }
            }
        }
    }
}
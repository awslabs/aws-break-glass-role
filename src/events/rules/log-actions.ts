import { EventPattern, IRuleTarget, RuleTargetInput } from "aws-cdk-lib/aws-events";
import { BreakGlassLogGroup } from "../../util/log-group";
import { Construct } from "constructs";
import { EventPatternField, LogActionsRuleProps } from "../../types";
import { BreakGlassRuleBase } from "../../util/rule-base";


export class LogActionsRule extends BreakGlassRuleBase {
    readOnly?: boolean
    eventSource?: EventPatternField
    constructor(
        scope: Construct, 
        id: string,
        props:LogActionsRuleProps
    ) {
        super(scope, id, props);
        if (props.logActions === 'read') this.readOnly = true;
        else if (props.logActions === 'write') this.readOnly = false;
        if (props.logServices?.length) {
            // TODO: Validate filter types
            this.eventSource = props.logServices.map(service => ({ prefix: service.toLowerCase() }))
        }
        this.rule.addEventPattern(this.pattern);
    }

    protected createTargets(message?:RuleTargetInput): IRuleTarget | IRuleTarget[] {
        this.hasMessage = !!message;
        return new BreakGlassLogGroup(this.scope,`${this.id}-log${this.targetCount}`,{
            retention: this.props.retentionDays,
            region: this.region
        })
    }

    protected createPattern(): EventPattern {
        let es:any = this.eventSource;
        // Again to please jsii
        if (
            es && 
            !Array.isArray(es) && 
            typeof es === 'object' && 
            es.hasOwnProperty('anythingBut')
        ) {
            es['anything-but'] = es.anythingBut;
            delete es.anythingBut;
        }
        return {
            detail: {
                readOnly: [this.readOnly],
                eventSource: es,
                userIdentity: {
                    arn: this.usernames.map(suffix => ({ suffix }))
                }
            }
        }
    }
}
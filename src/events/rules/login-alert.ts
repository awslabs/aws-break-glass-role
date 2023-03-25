import { EventPattern, IRuleTarget, RuleTargetInput } from "aws-cdk-lib/aws-events";
import { SnsTopic } from "aws-cdk-lib/aws-events-targets";
import { Subscription, SubscriptionProtocol, Topic } from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
import { BreakGlassLogGroup } from "../../util/log-group";
import { BreakGlassRuleBase } from "../../util/rule-base";
import { LoginAlertRuleProps } from "../../types";
export class LoginAlertRule extends BreakGlassRuleBase {

    constructor(
        scope: Construct, 
        id: string,
        props:LoginAlertRuleProps
    ) {
        super(scope,id,props);
    }

    protected createBasePattern(): EventPattern {
        return {
            source: ['aws.signin']
        }
    }

    protected createPattern(): EventPattern {
        const basePattern = this.basePattern;
        if (!this.isMainRule) return basePattern;
        return {
            ...basePattern,
            detail: {
                userIdentity: {
                    arn: this.usernames.map(suffix => ({ suffix }))
                }
            }
        }
    }

    protected createTargets(message?:RuleTargetInput): IRuleTarget | IRuleTarget[] {
        this.hasMessage = !!message;
        const props = this.props as LoginAlertRuleProps;
        const res:IRuleTarget[] = []
        if (!props.loginAlertEmails?.length && !props.sendLogs) {
            throw new Error('Fields "loginAlertEmails" and "sendLogs" can\'t both be empty');
        }
        if (props.loginAlertEmails?.length) {
            const topic = new Topic(this.scope, `${this.id}-topic${this.targetCount}`, {
                topicName: `${this.id}-topic${this.targetCount}-${this.region}`,
            });
            props.loginAlertEmails.forEach(email => {
                new Subscription(this.scope, `${this.id}-subscription${this.targetCount}-${email}`, {
                    endpoint:email,
                    protocol: SubscriptionProtocol.EMAIL,
                    topic,
                })
            });
            if (message) res.push(new SnsTopic(topic, {message}))
        }
        if (props.sendLogs) { 
            res.push(
                new BreakGlassLogGroup(this.scope,`${this.id}-log${this.targetCount}`,{
                    retention: this.props.retentionDays,
                    region: this.region
                })
            )
        }
        return res;
    }

}
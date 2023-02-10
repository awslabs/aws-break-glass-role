import { Construct } from "constructs";
import { CloudWatchLogGroup } from "aws-cdk-lib/aws-events-targets";
import { LogGroup, LogGroupProps } from "aws-cdk-lib/aws-logs";
import { Resource, ResourceProps, Stack } from "aws-cdk-lib";
import { randomBytes } from "crypto";
import { IRule, IRuleTarget, RuleTargetConfig } from "aws-cdk-lib/aws-events";

export interface BreakGlassLogProps extends ResourceProps, LogGroupProps {
    region?: string
}

export class BreakGlassLogGroup extends Resource implements IRuleTarget {
    ruleTarget: CloudWatchLogGroup;
    constructor(scope: Construct, id: string, props: BreakGlassLogProps) {
        super(scope,id, {
            physicalName: id
        });
        const randomString = randomBytes(5).toString('hex');
        const region = props.region || Stack.of(this).region;
        this.ruleTarget = new CloudWatchLogGroup(new LogGroup(scope, `${id}-${randomString}`, {
            logGroupName: `${id}-${region}-${randomString}`,
            retention: props.retention
        }))
    }

    bind(rule: IRule, id?: string): RuleTargetConfig {
        return this.ruleTarget.bind(rule,id);
    }

}
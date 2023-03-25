import { Resource, Stack } from "aws-cdk-lib";
import { EventBus, EventPattern, IRuleTarget, Rule, RuleTargetInput } from "aws-cdk-lib/aws-events";
import { EventBus as TargetBus } from 'aws-cdk-lib/aws-events-targets';
import { IRole, IUser } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { BreakGlassRuleBaseProps } from "../types";

export abstract class BreakGlassRuleBase extends Resource {
    rule: Rule;
    usernames: (IRole | IUser | string)[] = this.props.usernames || [];
    eventBus: EventBus;
    readonly region:string = this.props.region || Stack.of(this).region;
    private $targets: IRuleTarget[] = [];

    protected targetCount = 1;
    protected hasMessage:boolean = false;

    constructor(
        protected scope: Construct, 
        protected id: string,
        protected props:BreakGlassRuleBaseProps
    ) {
        super(scope,id, {
            physicalName: id
        });
        this.eventBus = props.eventBus;
        if (this.isMainRule) {
            new Rule(scope, `${id}-busrouter`, {
                ruleName:  `${id}-busrouter-${this.region}`,
                targets: [ new TargetBus(this.eventBus,{role:this.props.busRole})],
                eventPattern: this.basePattern
            })
        }
        this.$createTargets();
        this.rule = new Rule(scope, `${id}-rule`, {
            ruleName: `${id}-rule-${this.region}`,
            targets:this.targets,
            eventPattern: this.pattern
        });
    }
    
    protected abstract createPattern(): EventPattern
    protected abstract createTargets(message?:RuleTargetInput): IRuleTarget | IRuleTarget[]

    get isMainRule():boolean {
        return this.region === this.props.mainRegion
    }

    get targets(): IRuleTarget[] {
        return this.$targets;
    }

    get pattern(): EventPattern {
        return this.createPattern();
    }

    get basePattern(): EventPattern {
        return this.createBasePattern();
    }

    addTarget(target:IRuleTarget): this {
        this.targetCount++;
        this.$targets.push(target);
        return this;
    }

    addTargets(targets:IRuleTarget[]): this {
        if (!Array.isArray(targets)) targets = [targets];
        targets.forEach(target => this.addTarget(target));
        return this;
    }

    protected createBasePattern(): EventPattern {
        return this.createPattern();
    }

    private $createTargets(): void {
        if (!this.isMainRule) {
            this.targetCount++;
            this.addTarget(new TargetBus(this.eventBus,{role:this.props.busRole}));
        } else {
            this.addTargets(this.createTargets(this.props.targetInput) as IRuleTarget[])
        }
    }
}
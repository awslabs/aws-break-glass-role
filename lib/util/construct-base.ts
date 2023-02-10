import { EventBus } from 'aws-cdk-lib/aws-events';
import { Effect, IRole, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { ITopic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { BreakGlassEventBus } from '../events/bus';
import { EventBusOptions, BreakGlassProps } from '../types';
import { BreakGlassRuleBase } from './rule-base';
import { BreakGlassBase } from './base';

export abstract class BreakGlassConstructBase extends BreakGlassBase {
  mainRule: BreakGlassRuleBase
  additionalRules: BreakGlassRuleBase[] = []

  targetBusRole: IRole
  eventBus:EventBus
  topic?:ITopic
  role?: IRole
  mainRegion: string;

  props: BreakGlassProps

  protected ruleCount = 0;
  protected busCount = 0;
  constructor(protected scope: Construct, protected id: string, props: BreakGlassProps) {
    super(scope, id, props);
    this.role = this.props.role;
    this.eventBus = this.getEventBus();
    this.targetBusRole = this.props.busRole || this.getTargetBusRole(this.eventBus);
    this.mainRegion = this.props.region || 'us-east-1';
    const regions = this.props.regions || [];
    this.mainRule = this.addRule(this.mainRegion);
    for (let i = 0; i < regions.length; i++) {
        const region = regions[i];
        if (region === this.props.region) continue;
        this.additionalRules.push(this.addRule(region));
    }
  }

  protected abstract setRule(region:string, name: string): BreakGlassRuleBase

  protected addRule(region: string): BreakGlassRuleBase {
    this.ruleCount++;
    const name = `${this.id}${this.ruleCount}`;
    return this.setRule(region, name);
  }

  protected getEventBus(): EventBus {
    this.busCount++;
    if (this.props.eventBus?.hasOwnProperty('eventBusArn')) return this.props.eventBus as EventBus;
    return new BreakGlassEventBus(this.scope, `${this.id}-bus${this.busCount}`, this.props.eventBus as EventBusOptions); 
  }

  protected getTargetBusRole(eventBus: EventBus):IRole {
    return new Role(this.scope, `${this.id}-target-role${this.busCount}`, {
        assumedBy: new ServicePrincipal('events.amazonaws.com'),
        inlinePolicies: {
          invokeEventBusPolicy: new PolicyDocument({
            statements: [new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['events:PutEvents'],
              resources: [eventBus.eventBusArn]
            })]
          })
        }
    })
  }
}

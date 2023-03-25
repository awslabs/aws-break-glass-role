import { ResourceProps } from "aws-cdk-lib"
import { EventBus, RuleTargetInput } from "aws-cdk-lib/aws-events"
import { IManagedPolicy, IRole, IUser, PolicyStatement } from "aws-cdk-lib/aws-iam"
import { LogGroupProps, RetentionDays } from "aws-cdk-lib/aws-logs"

export interface BreakGlassBaseProps extends ResourceProps {
  readonly usernames:(IUser | string)[]
  readonly regions?: string[]
  readonly eventBus?:IEventBusOptions | EventBus
  readonly retention?: RetentionDays
  readonly role?: IRole
  readonly deployer?: string | IRole | IUser | boolean
  readonly deployerExists?: 'user' | 'role'
  readonly canManageBreakGlassRole?:boolean
}

export interface BreakGlassProps extends BreakGlassBaseProps {
    readonly loginAlertEmails?:string[]
    readonly logActions?: 'read' | 'write' | boolean
    readonly logServices?: string[]
    readonly createLoginLogGroup?: boolean
    readonly message?: string
    readonly busRole?: IRole
}

export interface BreakGlassRoleProps extends BreakGlassProps {
    readonly managedPolicies?: IManagedPolicy[]
    readonly policyStatements?: PolicyStatement[]
}

export interface BreakGlassRuleBaseProps extends ResourceProps{
  readonly usernames: (IRole | IUser | string)[]
  readonly eventBus:EventBus
  readonly busRole:IRole
  readonly mainRegion: string
  readonly targetInput?: RuleTargetInput
  readonly role?:IRole
  readonly retentionDays?: RetentionDays
}

export interface BreakGlassLoginAlertProps extends BreakGlassBaseProps {
  readonly loginAlertEmails?: string[]
  readonly createLoginLogGroup?: boolean
  readonly message?:string
}

export interface BreakGlassDeployerProps {
  readonly breakGlassRole?: IRole
  readonly assumedBy?: string | IUser | IRole
  readonly exists?: 'user' | 'role'
}

export interface BreakGlassLogActionsProps extends BreakGlassBaseProps {
  readonly logActions?: 'read' | 'write' | boolean
  readonly logServices?: string[]
}

export interface BreakGlassLogProps extends ResourceProps, LogGroupProps {}

export interface LoginAlertRuleProps extends BreakGlassRuleBaseProps {
  readonly loginAlertEmails?: string[]
  readonly sendLogs?:boolean
}

export interface LogActionsRuleProps extends BreakGlassRuleBaseProps {
  readonly logActions?: 'read' | 'write' | boolean
  readonly logServices?: string[]
}

export interface IEventBusOptions {
    fieldType?: 'name' | 'source'
    fieldValue: string  
}

export type EventInput = Record<string, string>

export interface TargetInput {
  readonly targetEvent: EventInput
  readonly message?: string
}

export interface CidrRange {
  readonly cidr: string
}

export type NumericMatchOperator = "<" | ">" | "=" | ">=" | "<=";

export interface EventPatternFieldFilter {
  readonly prefix?: string
  readonly suffix?: string
  readonly exists?: boolean 
  readonly anythingBut?: string[]
  // readonly numeric?: [NumericMatchOperator, number, NumericMatchOperator?, number?]
  // change to support jsii
  readonly numeric?: (NumericMatchOperator | number)[]
  readonly sourceIpAddress?: CidrRange[]
}

export type EventPatternItem = EventPatternFieldFilter | string | boolean

export type EventPatternField = EventPatternItem | EventPatternItem[]

import { ResourceProps } from "aws-cdk-lib"
import { EventBus, RuleTargetInput } from "aws-cdk-lib/aws-events"
import { IManagedPolicy, IRole, IUser, PolicyStatement } from "aws-cdk-lib/aws-iam"
import { LogGroupProps, RetentionDays } from "aws-cdk-lib/aws-logs"

export interface BreakGlassBaseProps extends ResourceProps {
  usernames:(IUser | string)[]
  regions?: string[]
  eventBus?:EventBusOptions | EventBus
  retention?: RetentionDays
  role?: IRole
  deployer?: string | IRole | IUser | boolean
  deployerExists?: 'user' | 'role'
  canManageBreakGlassRole?:boolean
}

export interface BreakGlassProps extends BreakGlassBaseProps {
    loginAlertEmails?:string[]
    logActions?: 'read' | 'write' | boolean
    logServices?: string[]
    createLoginLogGroup?: boolean
    message?: string
    busRole?: IRole
}

export interface BreakGlassRoleProps extends BreakGlassProps {
    managedPolicies?: IManagedPolicy[]
    policyStatements?: PolicyStatement[]
}

export interface EventBusOptions {
    type?: 'name' | 'source'
    value: string  
}

export interface CidrRange {
  cidr: string
}

export type NumericMatchOperator = "<" | ">" | "=" | ">=" | "<=";

export interface EventPatternFieldFilter {
  prefix?: string
  suffix?: string
  exists?: boolean 
  ['anything-but']?: string[]
  numeric?: [NumericMatchOperator, number, NumericMatchOperator?, number?]
  sourceIpAddress?: CidrRange[]
}

export type EventPatternItem = EventPatternFieldFilter | string | boolean

export type EventPatternField = EventPatternItem | EventPatternItem[]

export interface EventPatternFields {
  [name: string]: EventPatternField
}

export interface LogActionsRuleProps extends BreakGlassRuleBaseProps {
  logActions?: 'read' | 'write' | boolean
  logServices?: string[]
}

export interface BreakGlassRuleBaseProps extends ResourceProps{
  usernames: (IRole | IUser | string)[]
  eventBus:EventBus
  busRole:IRole
  mainRegion: string
  targetInput?: RuleTargetInput
  role?:IRole
  region?: string
  retentionDays?: RetentionDays
}

export interface BreakGlassDeployerProps {
  breakGlassRole?: IRole
  assumedBy?: string | IUser | IRole
  exists?: 'user' | 'role'
}

export interface BreakGlassLogProps extends ResourceProps, LogGroupProps {
  region?: string
}

export interface BreakGlassLogActionsProps extends BreakGlassBaseProps {
  logActions?: 'read' | 'write' | boolean
  logServices?: string[]
}

export interface BreakGlassLoginAlertProps extends BreakGlassBaseProps {
  loginAlertEmails?: string[]
  createLoginLogGroup?: boolean
  message?:string
}

export interface LoginAlertRuleProps extends BreakGlassRuleBaseProps {
  loginAlertEmails?: string[]
  sendLogs?:boolean
}

export interface EventInput {
  [name:string]: string
}

export interface TargetInput {
  event: EventInput
  message?: string
}

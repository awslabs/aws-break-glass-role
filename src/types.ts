import { RemovalPolicy, ResourceProps } from "aws-cdk-lib"
import { EventBus } from "aws-cdk-lib/aws-events"
import { IManagedPolicy, IRole, IUser, PolicyStatement } from "aws-cdk-lib/aws-iam"
import { RetentionDays } from "aws-cdk-lib/aws-logs"

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


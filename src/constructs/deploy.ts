import { Resource, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { 
    AccountRootPrincipal, 
    IRole, 
    IUser, 
    Policy, 
    Effect, 
    PolicyStatement, 
    Role, 
    User 
} from "aws-cdk-lib/aws-iam";
import { BreakGlassDeployerProps } from "../types";
export class BreakGlassDeployer extends Resource {
    assumedBy: IUser | IRole
    role?: IRole = this.props?.breakGlassRole

    constructor(
        protected scope:Construct, 
        protected id: string, 
        protected props?: BreakGlassDeployerProps
    ) {
        super(scope,id, {
            physicalName: id
        });
        this.assumedBy = this.getAssumedBy();
        this.assumedBy.attachInlinePolicy(new Policy(
            this.scope, 
            `${this.id}-deployer-policy`,
            {
                policyName: `${this.id}-deployer-policy-${Stack.of(this).region}`,
                statements: this.generateDeployerPermissions()
            }
        ))
    }

    generateDeployerPermissions(): PolicyStatement[] {
        const res = [
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['sts:AssumeRole'],
                resources: [`arn:aws:iam::${Stack.of(this).account}:role/cdk-*`]
            }),

            // To delete logs before retrying integration tests
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['logs:DescribeLogGroups'],
                resources: [`arn:aws:logs:*:${Stack.of(this).account}:log-group:*`]
            }),
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['logs:DeleteLogGroup'],
                resources: [
                    `arn:aws:logs:*:${Stack.of(this).account}:log-group:integ-*`,
                    `arn:aws:logs:*:${Stack.of(this).account}:log-group:my-integ-*`,
                    `arn:aws:logs:*:${Stack.of(this).account}:log-group:/aws/lambda/integ-*`
                ]
            })
        ]
        if (this.props?.breakGlassRole) {
            res.push(new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['iam:*'],
                resources: [this.props.breakGlassRole.roleArn]
            }))
        }
        return res;
    }

    private getAssumedBy(): IUser | IRole {
        if (!this.props?.assumedBy) return new Role(
            this.scope, 
            `${this.id}-deployer`,
            {
                roleName: `${this.id}-deployer-${Stack.of(this).region}`,
                assumedBy: new AccountRootPrincipal()
            }
        );
        if ((this.props.exists === 'user' && this.props.assumedBy.hasOwnProperty('roleArn')) ||
        (this.props.exists === 'role' && this.props.assumedBy.hasOwnProperty('userArn'))) {
            throw new Error(`User/Role Mismatch: "AssumedBy" should be a ${this.props.exists}`);
        }
        let assumedBy: string | undefined;
        if (this.props.exists && this.props.assumedBy && typeof this.props.assumedBy !== 'string') {
            assumedBy = this.props.exists === 'role' ? (this.props.assumedBy as IRole).roleName :
            (this.props.assumedBy as IUser).userName;
        } else if (typeof this.props.assumedBy === 'string') assumedBy = this.props.assumedBy
        if (typeof assumedBy === 'string') return this.getAssumedByFromString(assumedBy, this.props.exists);
        if (!this.props.assumedBy.hasOwnProperty('userArn') && !this.props.assumedBy.hasOwnProperty('roleArn')) {
            throw new Error('User object must be of type "IUser" or "IRole"');
        }
        return this.props.assumedBy as (IUser | IRole);
    }

    private getAssumedByFromString(assumedBy: string, exists?: 'user' | 'role'): IUser | IRole {
        const account = Stack.of(this).account;
        if (exists === 'user') {
            return User.fromUserArn(
                this.scope, 
                `${this.id}-deployer`, 
                `arn:aws:iam::${account}:user/${assumedBy}`
            );
        } else if (exists === 'role') {
            return Role.fromRoleArn(
                this.scope, 
                `${this.id}-deployer`,
                `arn:aws:iam::${account}:role/${assumedBy}`
            )
        }
        return new User(this.scope, `${this.id}-deployer`, {
            userName: assumedBy
        });
    }
}
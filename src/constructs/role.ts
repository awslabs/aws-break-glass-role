import { 
    AccountPrincipal, 
    Effect, 
    IManagedPolicy, 
    IPrincipal, 
    IRole, 
    ManagedPolicy, 
    PolicyDocument, 
    PolicyStatement, 
    Role 
} from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { BreakGlassBaseProps, BreakGlassRoleProps } from "../types";
import { BreakGlassBase } from "../util/base";
import { BreakGlassLogActions } from "./log-actions";
import { BreakGlassLoginAlert } from "./login-alert";
import { CfnOutput, Stack } from "aws-cdk-lib";
import { BreakGlassDeployer } from "./deployer";

export class BreakGlassRole extends BreakGlassBase {
    role: IRole;
    loginAlert?: BreakGlassLoginAlert
    logActions?: BreakGlassLogActions
    canManageBreakGlassRole?:boolean
    constructor(
        scope: Construct, 
        id: string, 
        props: BreakGlassRoleProps
    ) {
        super(scope,id, props);
        this.canManageBreakGlassRole = props.role ? props.canManageBreakGlassRole : true;
        this.role = this.createRole();
        if (props.deployer) {
            const deployer = typeof props.deployer === 'boolean' ? undefined : props.deployer;
            new BreakGlassDeployer(scope, `${id}-deploy`, {
              breakGlassRole:  props.canManageBreakGlassRole ? this.role : undefined,
              assumedBy: deployer,
              exists: props.deployerExists
            });
        }
        if (props.loginAlertEmails?.length || props.createLoginLogGroup) {
            this.loginAlert = new BreakGlassLoginAlert(scope, `${id}-LoginAlert`, {
                ...this.getBaseProps(),
                loginAlertEmails: props.loginAlertEmails,
                createLoginLogGroup: props.createLoginLogGroup,
                message: props.message,
            });
            this.loginAlert.node.addDependency(this.role);
        }
        if (props.logActions || props.logServices) {
            this.logActions = new BreakGlassLogActions(scope, `${id}-LogActions`, {
                ...this.getBaseProps(),
                logActions: props.logActions,
                logServices: props.logServices,
            });
            this.logActions.node.addDependency(this.role);
        }
    } 

    protected createRole(): IRole {
        const props = this.props;
        let role = props.role;
        const assumedBy = (new AccountPrincipal(Stack.of(this).account)).withConditions({
            StringEqualsIgnoreCase: {
                "aws:username": this.usernames
            }
        });
        if (!role) {
            role = new Role(this.scope, `${this.id}-break-glass`, {
                roleName: `${this.id}-break-glass`,
                assumedBy,
                managedPolicies: this.getManagedPolicies(),
                inlinePolicies: this.getInlinePolicies(),
            });
        }
        if (this.canManageBreakGlassRole) {
                this.createAssumeRole(
                    assumedBy,
                    role.roleArn
                );
        }

        new CfnOutput(this.scope, `${this.id}-break-glass-role-name`, {
            exportName: `${this.id}BreakGlassRoleName`,
            value: role.roleName
        });

        return role;
      }
    
      protected getManagedPolicies(): IManagedPolicy[] | undefined {
        let policies: IManagedPolicy[] | undefined = [];
        const props = this.props as BreakGlassRoleProps;
        const mpLength = props.managedPolicies?.length || 0;
        if (!mpLength && !props.policyStatements?.length) {
            policies.push(ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));
        } else if (mpLength) policies = props.managedPolicies;
        else policies = undefined;
        this.adminWarn(policies);
        return policies;
      }
    
      protected getInlinePolicies(): ({ [name:string]: PolicyDocument}) | undefined {
        const props = this.props as BreakGlassRoleProps;
        if (!props.policyStatements?.length) return undefined;
        this.policyCount++;
        const name = `${this.id}-policy${this.policyCount}`;
        return {
            [name]: new PolicyDocument({
                statements: props.policyStatements
            })
        }
    }
    
    private getBaseProps(): BreakGlassBaseProps {
        return {
            usernames: this.usernames,
            regions: this.props.regions,
            eventBus: this.props.eventBus,
            retention: this.props.retention,
            role: this.role
        }
    }

    private createAssumeRole(assumedBy: IPrincipal, roleArn: string): IRole {
        return  new Role(this.scope, `${this.id}-user-assume-role`, {
            assumedBy,
            inlinePolicies: {
                [`${this.id}-user-assume-policy`]: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            effect: Effect.ALLOW,
                            actions: ['sts:AssumeRole'],
                            resources: [roleArn]
                        })
                    ]
                })
            }
        })
    }
}
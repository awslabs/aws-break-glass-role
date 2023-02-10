import { Match, Template } from 'aws-cdk-lib/assertions';
import { BreakGlassDeployer } from '../lib/constructs/Deployer';
import { App, Stack } from 'aws-cdk-lib';
import { AccountPrincipal, AccountRootPrincipal, Group, IUser, User } from 'aws-cdk-lib/aws-iam';
import { Role } from 'aws-cdk-lib/aws-iam';
import { testName } from './variables';

let app:App, 
    stack:Stack, 
    template: Template;

const PolicyName = Match.objectLike({
    'Fn::Join': [
        "",
        Match.arrayWith([`${testName}-deployer-policy-`])
    ]
});

const Statement = [
    Match.objectLike({
        Action: 'sts:AssumeRole',
        Resource: Match.objectLike({
            "Fn::Join": ["", Match.arrayWith([':role/cdk-*'])]
        })
    }),
    Match.objectLike({
        Action: 'logs:DescribeLogGroups',
        Resource: Match.objectLike({
            "Fn::Join": ["", Match.arrayWith([':log-group:*'])]
        })
    }),
    Match.objectLike({
        Action: 'logs:DeleteLogGroup',
        Resource: [
            Match.objectLike({
                "Fn::Join": ["", Match.arrayWith([':log-group:integ-*'])]
            }),
            Match.objectLike({
                "Fn::Join": ["", Match.arrayWith([':log-group:my-integ-*'])]
            }),
            Match.objectLike({
                "Fn::Join": ["", Match.arrayWith([':log-group:/aws/lambda/integ-*'])]
            })
        ]
    })
]

describe('BreakGlassDeployer', () => {
    beforeEach(() => {
        app = new App();
        stack = new Stack(app, "TestStack");
    });

    it('Creates Default BreakGlassDeployer', () => {
        new BreakGlassDeployer(stack, testName);
        template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::IAM::Role', {
            RoleName: Match.objectLike({
                'Fn::Join': [
                    "",
                    Match.arrayWith([`${testName}-deployer-`])
                ]
            }),
            AssumeRolePolicyDocument: Match.objectLike({
                Statement: [
                    Match.objectLike({
                        Action: 'sts:AssumeRole',
                        Principal: Match.objectLike({
                            AWS: Match.objectLike({
                                'Fn::Join': [
                                    "",
                                    Match.arrayWith([':root'])
                                ]
                            })
                        })
                    })
                ]
            })
        });
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyName,
            Roles: [{
                Ref: Match.stringLikeRegexp(`${testName}deployer`)
            }],
            PolicyDocument: { Statement }                
        });
    });

    it('Creates BreakGlassDeployer With New User', () => {
        new BreakGlassDeployer(stack, testName, {
            assumedBy: 'myUser'
        });
        template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::IAM::User', {
            UserName: `myUser`
        });
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyName,
            Users: [{
                Ref: Match.stringLikeRegexp(`${testName}deployer`)
            }],
            PolicyDocument: { Statement }                
        });
    });

    it('Creates BreakGlassDeployer With Imported User', () => {
        new BreakGlassDeployer(stack, testName, {
            assumedBy: 'integ-user',
            exists: 'user'
        });
        template = Template.fromStack(stack);

        template.resourceCountIs('AWS::IAM::User', 0);
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyName,
            Users: ['integ-user']               
        });
    });

    it('Creates BreakGlassDeployer With Imported User Object', () => {
        new BreakGlassDeployer(stack, testName, {
            assumedBy: User.fromUserName(stack, 'integ-user', 'integ-user'),
            exists: 'user'
        });
        template = Template.fromStack(stack);

        template.resourceCountIs('AWS::IAM::User', 0);
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyName,
            Users: ['integ-user']               
        });
    });

    it('Creates BreakGlassDeployer With Imported Role', () => {
        new BreakGlassDeployer(stack, testName, {
            assumedBy: 'integ-role',
            exists: 'role'
        });
        template = Template.fromStack(stack);

        template.resourceCountIs('AWS::IAM::User', 0);
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyName,
            Roles: ['integ-role']               
        });
    });

    it('Creates BreakGlassDeployer With IUser object', () => {
        new BreakGlassDeployer(stack, testName, {
            assumedBy: new User(stack, 'myUser', {userName:'myUser'})
        });
        template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::IAM::User', {
            UserName: `myUser`
        });
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyName,
            Users: [{
                Ref: Match.stringLikeRegexp('myUser')
            }],
            PolicyDocument: { Statement }          
        });
    });

    it('Creates BreakGlassDeployer With IUser object', () => {
        new BreakGlassDeployer(stack, testName, {
            assumedBy: new User(stack, 'myUser', {userName:'myUser'})
        });
        template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::IAM::User', {
            UserName: `myUser`
        });
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyName,
            Users: [{
                Ref: Match.stringLikeRegexp('myUser')
            }],
            PolicyDocument: { Statement }          
        });
    });

    it('Throws Error with wrong principal type', () => {
        expect (() => {
            new BreakGlassDeployer(stack, testName, {
                assumedBy: new Group(stack, 'myUser') as unknown as IUser
            });
        }).toThrowError('User object must be of type "IUser" or "IRole"');
    });

    it('Creates BreakGlassDeployer With IRole object', () => {
        new BreakGlassDeployer(stack, testName, {
            assumedBy: new Role(stack, 'myUser', {
                roleName:'myRole',
                assumedBy: new AccountRootPrincipal()
            })
        });
        template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::IAM::Role', {
            RoleName: 'myRole',
            AssumeRolePolicyDocument: Match.objectLike({
                Statement: [
                    Match.objectLike({
                        Action: 'sts:AssumeRole',
                        Principal: Match.objectLike({
                            AWS: Match.objectLike({
                                'Fn::Join': [
                                    "",
                                    Match.arrayWith([':root'])
                                ]
                            })
                        })
                    })
                ]
            })
        });
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyName,
            Roles: [{
                Ref: Match.stringLikeRegexp('myUser')
            }]            
        });
    });

    it('Creates BreakGlassDeployer Deployer Permissions Policy', () => {
        new BreakGlassDeployer(stack, testName, {
            assumedBy: new Role(stack, 'myUser', {
                roleName:'myRole',
                assumedBy: new AccountRootPrincipal(),
            }),
            breakGlassRole: new Role(stack, 'myBreakGlassRole', {
                assumedBy: new AccountPrincipal(stack.account),
                roleName: 'myBreakGlassRole'
            })
        });
        template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::IAM::Policy', {
            PolicyName,
            Roles: [{
                Ref: Match.stringLikeRegexp('myUser')
            }],
            PolicyDocument: { 
                Statement: [
                    ...Statement,
                    Match.objectLike({
                        Action: 'iam:*',
                        Resource: Match.objectLike({
                            "Fn::GetAtt": Match.arrayWith([
                                Match.stringLikeRegexp('myBreakGlassRole')
                            ])
                        })
                    })
                ]   
            }        
        });
    });

    it('Throws error when User/Role mismatch', () => {
        expect (() => {
            new BreakGlassDeployer(stack, testName, {
                assumedBy: new Role(stack, 'myUser', {
                    roleName:'myRole',
                    assumedBy: new AccountRootPrincipal()
                }),
                exists: 'user'
            });
        }).toThrowError('User/Role Mismatch: "AssumedBy" should be a user');
    });
});
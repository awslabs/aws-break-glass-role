import { Match, Template } from 'aws-cdk-lib/assertions';
import { BreakGlassRole } from '../src/constructs/role';
import { App, Stack } from 'aws-cdk-lib';
import { AccountPrincipal, Effect, ManagedPolicy, PolicyStatement, Role, User } from 'aws-cdk-lib/aws-iam';
import { testName, Principal, detail, loginAlertRule, logActionsRule } from './variables';

let app:App,
    stack:Stack,
    template: Template,
    consoleWarn: any
describe('BreakGlassRole', () => {
    beforeEach(() => {
        app = new App();
        stack = new Stack(app, "TestStack");
        consoleWarn = jest.spyOn(console, 'warn');
    });

    afterEach(() => {
        consoleWarn.mockRestore();
    });

    it('Creates Default BreakGlassRole', () => {
        new BreakGlassRole(stack, testName, {
            usernames: ["myUser"],
            role: new Role(stack, 'myRole', {
                assumedBy: new AccountPrincipal(stack.account),
                roleName: 'myRole'
            }),
        })
        template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::IAM::Role', {
            AssumeRolePolicyDocument: {
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Effect: "Allow",
                        Principal: {
                            AWS:  {
                                "Fn::Join": [
                                    "",
                                    Match.arrayWith([":iam::", ":root"])
                                ]
                            }
                        }
                    }
                ]
            },
            RoleName: "myRole"
        });
    });

    it('Creates Role From Role Props', () => {
        new BreakGlassRole(stack, testName, {
            usernames: ["myUser"]
        });
        template = Template.fromStack(stack);
        expect(consoleWarn).toHaveBeenCalledWith("You have chosen to give Break Glass Users Administrative Access. It is strongly recommended to follow the Least Privilege access principle even when configuring break glass roles. For more info see 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#grant-least-privilege'");
        template.hasResourceProperties('AWS::IAM::Role', {
            AssumeRolePolicyDocument: {
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Effect: "Allow",
                        Principal
                    }
                ],
            },
            ManagedPolicyArns: [
                {
                    "Fn::Join": [
                        "",
                        [
                            "arn:",
                            { Ref: "AWS::Partition" },
                            ":iam::aws:policy/AdministratorAccess"
                        ]
                    ]
                }
            ],
            RoleName: `${testName}-break-glass`
        });
    });


    it('Creates Role From Role Props With Custom Managed Policy', () => {
        new BreakGlassRole(stack, testName, {
            usernames: ["myUser"],
            managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('job-function/ViewOnlyAccess')]
        })
        template = Template.fromStack(stack);
        expect(consoleWarn).not.toHaveBeenCalled();
        template.hasResourceProperties('AWS::IAM::Role', {
            ManagedPolicyArns: [
                {
                    "Fn::Join": [
                        "",
                        [
                            "arn:",
                            { Ref: "AWS::Partition" },
                            ":iam::aws:policy/job-function/ViewOnlyAccess"
                        ]
                    ]
                }
            ]
        });
    });

    it('Creates Role From Role Props With Custom InlinePolicies', () => {
        new BreakGlassRole(stack, testName, {
            usernames: ["myUser"],
            policyStatements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ['s3:Get*', 's3:PutObject'],
                    resources: ['*']
                }),
                    new PolicyStatement({
                    effect: Effect.DENY,
                    actions: ['s3:PutObjectAcl'],
                    resources: ['*']
                })
            ]
        })
        template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::IAM::Role', {
            ManagedPolicyArns: Match.absent(),
            Policies: [
                {
                    PolicyName: Match.stringLikeRegexp(`${testName}-policy`),
                    PolicyDocument: {
                        Statement: [
                            {
                                Action: [
                                    "s3:Get*",
                                    "s3:PutObject"
                                ],
                                Effect: "Allow",
                                Resource: "*"
                            },
                            {
                                Action: "s3:PutObjectAcl",
                                Effect: "Deny",
                                Resource: "*"
                            }
                        ],
                    }
                }
            ]
        });
    });

    it('Creates Role From Role Props With Multiple Custom Policy Types',  () => {
        new BreakGlassRole(stack, testName, {
            usernames: [User.fromUserName(stack, `${testName}-username`, 'myUser')],
            managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('job-function/ViewOnlyAccess')],
            policyStatements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ['s3:Get*', 's3:PutObject'],
                    resources: ['*']
                })
            ]
        })
        template = Template.fromStack(stack);
        expect(consoleWarn).not.toHaveBeenCalled();
        template.hasResourceProperties('AWS::IAM::Role', {
            ManagedPolicyArns: [
                {
                    "Fn::Join": [
                        "",
                        [
                            "arn:",
                            { Ref: "AWS::Partition" },
                            ":iam::aws:policy/job-function/ViewOnlyAccess"
                        ]
                    ]
                }
            ],
            Policies: [
                {
                    PolicyName: `${testName}-policy1`,
                    PolicyDocument: {
                        Statement: [
                            {
                                Action: [
                                    "s3:Get*",
                                    "s3:PutObject"
                                ],
                                Effect: "Allow",
                                Resource: "*"
                            }
                        ],
                    }
                }
            ]
        });
    });

    it('Creates Role With LoginAlert', () => {
        new BreakGlassRole(stack, testName, {
            usernames: ["myUser"],
            role: new Role(stack, 'myRole', {
                assumedBy: new AccountPrincipal(stack.account),
                roleName: 'myRole'
            }),
            loginAlertEmails: ["myEmail@me.com", "myEmail@example.com", "myEmail@mail.com"]
        })
        template = Template.fromStack(stack);
        template.resourceCountIs('Custom::CloudwatchLogResourcePolicy', 0);
        template.resourceCountIs('AWS::SNS::Topic', 1);
        template.resourceCountIs('AWS::SNS::Subscription', 3);
        template.hasResourceProperties('AWS::Events::Rule', loginAlertRule);
        template.hasResourceProperties('AWS::Events::Rule', {
            Name: {
                "Fn::Join": [
                  "",
                  [
                    Match.stringLikeRegexp(`${testName}\-LoginAlert\\d\-busrouter\-`),
                    { Ref: "AWS::Region" }
                  ]
                ]
            },
            EventPattern: {
                source: ["aws.signin"]
            },
            Targets: [{
                Arn: {
                    "Fn::GetAtt": [
                        Match.stringLikeRegexp(`${testName}LoginAlertbus`),
                      "Arn"
                    ]
                },
                RoleArn: {
                    "Fn::GetAtt": [
                        Match.stringLikeRegexp(`${testName}LoginAlerttargetrole`),
                      "Arn"
                    ]
                }
            }],
        });
        template.hasResourceProperties('AWS::SNS::Subscription', {
          Protocol: "email",
          Endpoint: "myEmail@me.com"
        });
    });

    it('Creates Role With LogActions', () => {
        new BreakGlassRole(stack, testName, {
            usernames: ["myUser"],
            role: new Role(stack, 'myRole', {
                assumedBy: new AccountPrincipal(stack.account),
                roleName: 'myRole'
            }),
            logActions: true
        });
        template = Template.fromStack(stack);
        template.resourceCountIs('Custom::CloudwatchLogResourcePolicy', 1);
        template.hasResourceProperties('AWS::Events::Rule', logActionsRule);
        template.resourceCountIs('AWS::SNS::Topic', 0);
        template.resourceCountIs('AWS::SNS::Subscription', 0);
    });

    it('Creates Role With LogActions and custom logActions and logServices', () => {
        new BreakGlassRole(stack, testName, {
            usernames: ["myUser"],
            role: new Role(stack, 'myRole', {
                assumedBy: new AccountPrincipal(stack.account),
                roleName: 'myRole'
            }),
            logActions: 'write',
            logServices: ['codepipeline', 'cloudformation']
        });
        template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::Events::Rule', {
            EventPattern: {
                detail: {
                    ...detail,
                    readOnly: [false],
                    eventSource: [
                        {
                          prefix: 'codepipeline'
                        },
                        {
                          prefix: 'cloudformation'
                        }
                    ]
                }
            }
        });
    });

    it('Creates Role With LoginAlert and LogActions', () => {
        new BreakGlassRole(stack, testName, {
            usernames: ["myUser"],
            role: new Role(stack, 'myRole', {
                assumedBy: new AccountPrincipal(stack.account),
                roleName: 'myRole'
            }),
            loginAlertEmails: ["myEmail@me.com", "myEmail@example.com", "myEmail@mail.com"],
            logActions: true
        })
        template = Template.fromStack(stack);
        template.resourceCountIs('Custom::CloudwatchLogResourcePolicy', 1);
        template.resourceCountIs('AWS::SNS::Topic', 1);
        template.resourceCountIs('AWS::SNS::Subscription', 3);
        template.hasResourceProperties('AWS::Events::Rule', loginAlertRule);
        template.hasResourceProperties('AWS::Events::Rule', logActionsRule);
    });

    it('Creates Deployer Role', () => {
        new BreakGlassRole(stack, testName, {
            usernames: ["myUser"],
            role: new Role(stack, 'myRole', {
                assumedBy: new AccountPrincipal(stack.account),
                roleName: 'myRole'
            }),
            deployer: new User(stack, 'deployer-user', {userName:'deployer-user'})
        })
        template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::IAM::User', {
            UserName: 'deployer-user'
        });
        template.hasOutput(`${testName}breakglassrolename`, {
            Export: {
                Name: testName + 'BreakGlassRoleName'
            },
            Value: {
                Ref: Match.stringLikeRegexp('myRole')
            }
        })
    });
});

import { Match, Template } from 'aws-cdk-lib/assertions';
import { BreakGlassLoginAlert as LoginAlert } from '../src/constructs/LoginAlert';
import { App, Stack } from 'aws-cdk-lib';
import { SigninTargetInput } from '../src/input/signin';
import { AccountPrincipal, Role } from 'aws-cdk-lib/aws-iam';
import { testName, detail, loginAlertRule } from './variables';

let app:App,
    stack:Stack,
    template: Template,
    con:LoginAlert
describe("BreakGlassLoginAlert", () => {
    beforeEach(() => {
        app = new App();
        stack = new Stack(app, "TestStack");
    });
    it('Creates Default Login Alert Constructs', () => {
        con = new LoginAlert(stack, testName, {
            usernames: ["myUser"],
            loginAlertEmails: ["myEmail@me.com", "myEmail@example.com", "myEmail@mail.com"]
        });
        template = Template.fromStack(stack);
        template.resourceCountIs('Custom::CloudwatchLogResourcePolicy', 0);
        template.resourceCountIs('AWS::SNS::Topic', 1);
        template.resourceCountIs('AWS::SNS::Subscription', 3);
        template.hasResourceProperties('AWS::Events::Rule', {
            EventPattern: {
                source: [
                  "aws.signin"
                ],
                detail
            },
            Name: {
                "Fn::Join": [
                  "",
                  [
                    Match.stringLikeRegexp(`${testName}\\d\-rule\-`),
                    { Ref: "AWS::Region" }
                  ]
                ]
            },
            Targets: [
                {
                  Arn: {
                    Ref: Match.stringLikeRegexp(`${testName}\\dtopic`)
                  },
                  Id: Match.stringLikeRegexp("Target\\d"),
                  InputTransformer: loginAlertRule.Targets[0].InputTransformer
                }
            ]
        });
        template.hasResourceProperties('AWS::Events::Rule', {
            Name: {
              "Fn::Join": [
                "",
                [
                  Match.stringLikeRegexp(`${testName}\\d\-busrouter\-`),
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
                      Match.stringLikeRegexp(`${testName}bus`),
                      "Arn"
                    ]
                },
                RoleArn: {
                    "Fn::GetAtt": [
                      Match.stringLikeRegexp(`${testName}targetrole`),
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
    it('Creates Login Alert Constructs in Multiple Regions', () => {
        con = new LoginAlert(stack, testName, {
            usernames: ["myUser"],
            loginAlertEmails: ["myEmail@me.com"],
            region:'us-west-2',
            regions: ['us-west-1']
        });
        template = Template.fromStack(stack);
        template.resourceCountIs('AWS::Events::Rule', 3);
        template.hasResourceProperties('AWS::Events::Rule', {
            Name: `${testName}1-busrouter-us-west-2`,
            EventPattern: {
                source: ["aws.signin"]
            }
        });
    });
    it('Bypasses main region if listed twice', () => {
        con = new LoginAlert(stack, testName, {
            usernames: ["myUser"],
            loginAlertEmails: ["myEmail@me.com"],
            region:'us-west-2',
            regions: ['us-west-1', 'us-west-2']
        });
        template = Template.fromStack(stack);
        template.resourceCountIs('AWS::Events::Rule', 3);
    });
    it('Matches for multiple Users', () => {
        con = new LoginAlert(stack, testName, {
            usernames: ["myUser", "myOtherUser"],
            loginAlertEmails: ["myEmail@me.com"]
        });
        template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::Events::Rule', {
            EventPattern: {
                source: [
                  "aws.signin"
                ],
                detail: {
                  userIdentity: {
                    arn: [
                      { suffix: "myUser" },
                      { suffix: "myOtherUser" }
                    ]
                  }
                }
            }
        });
    });
    it('Matches for Assumed Roles', () => {
        con = new LoginAlert(stack, testName, {
            usernames: ["myUser"],
            loginAlertEmails: ["myEmail@me.com"],
            role: new Role(stack, 'myRole', {
                assumedBy: new AccountPrincipal(stack.account),
                roleName: 'myRole'
            })
        });
        template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::Events::Rule', {
            EventPattern: {
                source: [
                  "aws.signin"
                ],
                detail
            },
        });
    });
    it('Transforms Message', () => {
        const msgSpy = jest.spyOn(SigninTargetInput, 'getTarget');
        con = new LoginAlert(stack, testName, {
            usernames: ["myUser"],
            loginAlertEmails: ["myEmail@me.com"],
            role: new Role(stack, 'myRole', {
                assumedBy: new AccountPrincipal(stack.account),
                roleName: 'myRole'
            }),
            message: "User <principal> logged in at <eventTime>"
        });

        template = Template.fromStack(stack);
        expect(msgSpy).toHaveBeenCalled();
        template.hasResourceProperties('AWS::Events::Rule', {
            Name: {
                "Fn::Join": [
                  "",
                  [
                    Match.stringLikeRegexp(`${testName}\\d\-rule\-`),
                    { Ref: "AWS::Region" }
                  ]
                ]
            },
            Targets: [
                {
                    Arn: { Ref: Match.stringLikeRegexp(`${testName}\\dtopic`) },
                    Id: Match.stringLikeRegexp("Target\\d"),
                    InputTransformer: {
                        InputPathsMap: {
                            "detail-userIdentity-principalId": "$.detail.userIdentity.principalId",
                            "detail-eventTime": "$.detail.eventTime"
                        },
                        InputTemplate: "\"User <detail-userIdentity-principalId> logged in at <detail-eventTime>\""
                    }
                }
            ]
        });
    });
    it('Creates Log Group', () => {
        con = new LoginAlert(stack, testName, {
            usernames: ["myUser"],
            loginAlertEmails: ["myEmail@me.com"],
            role: new Role(stack, 'myRole', {
                assumedBy: new AccountPrincipal(stack.account),
                roleName: 'myRole'
            }),
            message: "User <principal> logged in at <eventTime>",
            createLoginLogGroup:true
        });
        template = Template.fromStack(stack);
        template.resourceCountIs("Custom::CloudwatchLogResourcePolicy", 1);
        template.hasResourceProperties('AWS::Logs::LogGroup', {
            LogGroupName: {
                "Fn::Join": [
                  "",
                  Match.arrayWith([
                    Match.stringLikeRegexp(`${testName}\\d\-log\\d\-`),
                    { Ref: "AWS::Region" }
                  ])
                ]
            },
            RetentionInDays: 90
        });
        template.hasResourceProperties('AWS::Events::Rule', {
            Targets: [
                {
                    Arn: { Ref: Match.stringLikeRegexp(`${testName}\\dtopic`) },
                    Id: Match.stringLikeRegexp("Target\\d"),
                    InputTransformer: {
                        InputPathsMap: {
                            "detail-userIdentity-principalId": "$.detail.userIdentity.principalId",
                            "detail-eventTime": "$.detail.eventTime"
                        },
                        InputTemplate: "\"User <detail-userIdentity-principalId> logged in at <detail-eventTime>\""
                    }
                },
                {
                    Arn: {
                        "Fn::Join": [
                            "",
                            [
                                "arn:",
                                { Ref: "AWS::Partition" },
                                ":logs:",
                                { Ref: "AWS::Region" },
                                ":",
                                { Ref: "AWS::AccountId" },
                                ":log-group:",
                                { Ref: Match.stringLikeRegexp(`${testName}\\dlog`) }
                            ]
                        ]
                    },
                    Id: Match.stringLikeRegexp("Target\\d")
                }
            ]
        });
    });

    it('Creates Only Log Group', () => {
      con = new LoginAlert(stack, testName, {
          usernames: ["myUser"],
          createLoginLogGroup:true
      });
      template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Logs::LogGroup', {
          LogGroupName: {
            "Fn::Join": [
              "",
              Match.arrayWith([
                Match.stringLikeRegexp(`${testName}\\d\-log\\d\-`),
                { Ref: "AWS::Region" }
              ])
            ]
          },
          RetentionInDays: 90
      });
      template.hasResourceProperties('AWS::Events::Rule', {
          Targets: [
              {
                  Arn: {
                      "Fn::Join": [
                          "",
                          [
                              "arn:",
                              { Ref: "AWS::Partition" },
                              ":logs:",
                              { Ref: "AWS::Region" },
                              ":",
                              { Ref: "AWS::AccountId" },
                              ":log-group:",
                              { Ref: Match.stringLikeRegexp(`${testName}\\dlog`) }
                          ]
                      ]
                  },
                  Id: Match.stringLikeRegexp("Target\\d")
              }
          ]
      });
  });
});

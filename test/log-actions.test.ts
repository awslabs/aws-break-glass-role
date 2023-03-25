import { Match, Template } from 'aws-cdk-lib/assertions';
import { App, Stack } from 'aws-cdk-lib';
import { BreakGlassLogActions as LogActions } from '../src/constructs/log-actions';
import { testName, detail } from './variables';

let app:App,
    stack:Stack,
    template: Template

describe("BreakGlassLogActions", () => {
    beforeEach(() => {
        app = new App();
        stack = new Stack(app, "TestStack");
    });
    it('Creates Default Login Alert Constructs', () => {
        new LogActions(stack, testName, {
            usernames: ["myUser"]
        });
        template = Template.fromStack(stack);
        template.resourceCountIs('Custom::CloudwatchLogResourcePolicy', 1);
        template.hasResourceProperties('AWS::Events::Rule', {
            EventPattern: { detail },
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
                  Id: "Target0"
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
            EventPattern: { detail },
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
    });

    it('Sets for Readonly', () => {
        new LogActions(stack, testName, {
            usernames: ["myUser"],
            logActions: 'read'
        });
        template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::Events::Rule', {
            EventPattern: {
                detail: {
                    ...detail,
                    readOnly: [true]
                }
            }
        });
    });

    it('Sets for Write only', () => {
        new LogActions(stack, testName, {
            usernames: ["myUser"],
            logActions: 'write'
        });
        template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::Events::Rule', {
            EventPattern: {
                detail: {
                    ...detail,
                    readOnly: [false]
                }
            }
        });
    });

    it('Sets Basic Pattern', () => {
      new LogActions(stack, testName, {
        usernames: ["myUser"],
        logServices: ['cloudformation']
      });
      template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Events::Rule', {
          EventPattern: {
              detail: {
                  ...detail,
                  eventSource: [{ prefix: 'cloudformation' }]
              }
          }
      });
  });

  it('Works with Pattern Filters', () => {
    new LogActions(stack, testName, {
      usernames: ["myUser"],
      logServices: ['codepipeline', 'cloudformation']
    });
    template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
            detail: {
                ...detail,
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

  it('Converts Single Filters', () => {
    new LogActions(stack, testName, {
      usernames: ["myUser"],
      logServices: ['codepipeline']

    });
    template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
            detail: {
                ...detail,
                eventSource: [
                  {
                    prefix: 'codepipeline'
                  }
                ]
            }
        }
    });
  });
});

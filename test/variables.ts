import { Match } from "aws-cdk-lib/assertions";
export const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
}

export const testName = "MyTestConstruct";

export const Principal = {
    AWS:  {
        "Fn::Join": [
            "", 
            [ 
                "arn:",
                { Ref: "AWS::Partition" },
                ":iam::",
                { Ref: "AWS::AccountId" },
                ":root"
            ]
        ]
    }
}

export const detail = {
    userIdentity: {
      arn: [{ suffix: "myUser" }]
    }
}


export const loginAlertRule = {
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
            Match.stringLikeRegexp(`${testName}\-LoginAlert\\d\-rule\-`),
            { Ref: "AWS::Region" }
          ]
        ]
    },
    Targets: [
        {
          Arn: {
            Ref: Match.stringLikeRegexp(`${testName}LoginAlert\\dtopic`)
          },
          Id: Match.stringLikeRegexp("Target\\d"),
          InputTransformer: {
            InputPathsMap: Match.objectLike({
              "detail-userIdentity-arn": "$.detail.userIdentity.arn",
              "detail-userIdentity-principalId": "$.detail.userIdentity.principalId",
              "detail-userAgent": "$.detail.userAgent",
              "detail-responseElements-ConsoleLogin": "$.detail.responseElements.ConsoleLogin"
            }),
            InputTemplate: Match.stringLikeRegexp("\<detail\-userIdentity\-principalId\>")
          }
        }
    ]
};

export const logActionsRule = {
    EventPattern: {
        detail
    },
    Name: {
        "Fn::Join": [
          "",
          [
            Match.stringLikeRegexp(`${testName}\-LogActions\\d\-busrouter\-`),
            { Ref: "AWS::Region" }
          ]
        ]
    },
    Targets: [
        {
          Arn: {
            "Fn::GetAtt": [
                Match.stringLikeRegexp(`${testName}LogActionsbus`),
                "Arn"
            ]
          },
          Id: "Target0",
          RoleArn: {
            "Fn::GetAtt": [
                Match.stringLikeRegexp(`${testName}LogActionstargetrole`),
              "Arn"
            ]
          }
        }
    ]
}
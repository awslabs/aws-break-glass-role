# AWS Break Glass Role

![Build](https://img.shields.io/github/actions/workflow/status/awslabs/aws-break-glass-role/release.yml?style=plastic)
![GitHub Repo stars](https://img.shields.io/github/stars/awslabs/aws-break-glass-role?style=plastic)
![License](https://img.shields.io/github/license/awslabs/aws-break-glass-role?style=plastic)
![Commitizen Friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=plastic)
![Semantic Release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=plastic)

***Create a break glass role for emergency use in order to limit AWS production account access. Configure automatic alerts and logging of activities in the role to secure its use in production environments.***

- [Basic Implementation](#basic-implementation)
- [Login Alerts](#login-alerts)
    - [Messages](#messages)
    - [Logging Login Alerts](#logging-login-alerts)
- [Log Actions](#log-actions)
    - [Logging Actions on Specific Services](#logging-actions-on-specific-services)
    - [Retention](#retention)
- [Regions](#regions)
- [Break Glass Role Properties](#break-glass-role-properties)
- [Break-Glass Deployer Permissions](#break-glass-deployer-permissions)
- [Available Constructs](#available-constructs)
- [Security](#security)
- [License](#license)  

## Break Glass Roles
Often when undergoing security reviews for applications in a full CI/CD deployment environment, it is recommended to restrict console access to the AWS account that hosts the production environment. A popular way to implement this recommendation is to remove all production write access completely from user and role policies.

In these cases it may be necessary to provision a user or role with elevated permissions to be used only in emergency cases. This type of role is typically called a "Break Glass Role" and is usually used in On Call situations or other circumstances when quick mitigating action is needed.

Since Break Glass roles aren't supposed to be assumed on a regular basis, it's a good idea to outfit the role with alerts when someone assumes it and/or logging of the actions performed using it. So the purpose of this package is to automate this entire process - from the creation of the role to the login alerts to the logging of activities. If the break glass role already exists, it can be passed in as an argument as well.

## Install

```bash
npm install aws-break-glass-role
```
  
## Basic Implementation
The only required property for the `BreakGlassRole` Resource is `usernames`. `Usernames` is a list of user identities that will be assuming the break glass role. If federated access is used, the user identity for the role can be found in the assumed role ARN contained in the signin event. The format of the ARN will be `<RoleArn>:role/<RoleName>/<UserIdentity>`.
```ts
    new BreakGlassRole(stack, testName, {
        usernames: ["myUser", "otherUser"]
    });
```
If you don't pass a `role` in, then the `Break Glass Role` will be created for you. The default created role with no policies attached will be created with full Administrator Access, but keep in mind that full access is not recommended even for Break Glass roles.

Policies can be attached to the role in lieu of full Administrator Access like this:
```ts
    new BreakGlassRole(stack, testName, {
        usernames: ["myUser", "otherUser"],
        managedPolicies: [
            ManagedPolicy.fromAwsManagedPolicyName(
                'job-function/ViewOnlyAccess'
            )
        ],
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

    });
```
The Principal of the trust policy for an internally created `Break-Glass Role` will be the Account Principal for the AWS account with conditions restricting the use of the role to the identities listed in the `usernames` property:
```json
{
    "Effect": "Allow",
        "Principal": {
            "AWS": "arn:aws:iam::111122223333:root"
        },
    "Action": "sts:AssumeRole",
    "Condition": {
        "StringEqualsIgnoreCase": {
            "aws:username": ["myUser", "otherUser"]
        }
    }
}
``` 
You can alternately use the `role` property to pass in an existing role to use as the `Break Glass Role`:
```ts
    new BreakGlassRole(stack, testName, {
        usernames: ["myUser", "otherUser"],
        role: Role.fromRoleName(stack, 'myImportedRole', 'myRole')
    });
```
The `BreakGlassRole` construct intends to automate as much of the process of outfitting a role for break-glass status as possible, but it also doesn't want to cause failures due to limited permissions. 

So when you import a role to have it outfitted for break-glass status, it will only interact with the role directly if you set the `canManageBreakGlassRole` property to `true`.

So what does it mean for a role to take on "break-glass" status? 
  
## Login Alerts

The first way a role displays break-glass properties is by sending login alerts to the necessary parties whenever the role is assumed. This can be done by sending login alert emails, by logging the events to Amazon CloudWatch, or by doing both.

To send email alerts, pass a list of email addresses to the `loginAlertEmails` property:

```ts
    new BreakGlassRole(stack, testName, {
        usernames: ["myUser"],
        role: Role.fromRoleName('myRole'),
        loginAlertEmails: [
            "myEmail@me.com", 
            "myEmail@example.com", 
            "myEmail@mail.com"
        ]
    });
```
The above implementation imports an existing role and sends alerts to the emails in `loginAlertEmails` whenever `myUser` assumes the role in the default region. Future versions of this package will allow for SMS and push notification alerts as well.

The alerts are created using an [Amazon EventBridge](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html) rule with an [Amazon SNS](https://docs.aws.amazon.com/sns/latest/dg/welcome.html) target. The only manual step involved in activating this is that the recipients of the emails must confirm the SNS subscription before receiving alerts.

### Messages
By default the Login Alerts will be sent as an unformatted JSON string of the Login event, but if you want to customize how the information is presented, you can use the `message` field. Some of the fields in the event can be referred to in this custom message using the following field names:

#### Login Event Information
* **username**: The user identity that logged in.
* **principal**: A unique session identifier for the user. Sometimes the user name is appended using the format `<identifier>:<username>`
* **account**: The account where the login took place.
* **eventTime**: The timestamp when the event took place.
* **region**: The AWS region where the login occurred.
* **eventId**: The unique id of the event.
* **requestId**: The unique id of the request, useful for [AWS X-Ray](https://docs.aws.amazon.com/xray/latest/devguide/aws-xray.html) traces.
* **ip**: The IP address of the event request
* **userAgent**: The User agent listed in the request
* **result**: The result of the request, either `Success` or `Failure`

```ts
 new BreakGlassRole(stack, testName, {
        usernames: ["myUser"],
        role: Role.fromRoleName('myRole'),
        loginAlertEmails: [
            "myEmail@me.com", 
            "myEmail@example.com", 
            "myEmail@mail.com"
        ],
        message: "User <principal> logged in at '<eventTime>'"
    });
```
The alert that results from the above resource would say something like `User AIDACKCEVSQ6C2EXAMPLE:myUser logged in at '2022-12-29T21:34:59Z'`
  

### Logging Login Alerts
Use the `createLoginLogGroup` property to log the login alerts in Amazon CloudWatch:
```ts
 new BreakGlassRole(stack, testName, {
        usernames: ["myUser"],
        role: Role.fromRoleName('myRole'),
        createLoginLogGroup: true
    });
```

## Log Actions
The second way a role displays break-glass properties is by keeping a log of user actions. You can log all user actions in the active regions by setting the `logActions` property to `true`, or you can specify which type of actions you want to log. For instance, if you only wanted to log `write` actions:
```ts
 new BreakGlassRole(stack, testName, {
        usernames: ["myUser"],
        role: Role.fromRoleName('myRole'),
        logActions: 'write'
    });
```

### Logging Actions On Specific Services
Logging user actions can become difficult to manage and expensive in many cases if left unchecked, so in addition to limiting logging to `read` or `write` actions, you can also limit by AWS service. Let's say you only need to monitor whether or not a user uses a `Break Glass Role` to perform write actions in AWS CodePipeline or CloudFormation. In that case you could pass a list of AWS service prefixes in the `logServices` property:
```ts
 new BreakGlassRole(stack, testName, {
    usernames: ["myUser"],
    role: Role.fromRoleName('myRole'),
    logServices: ['codepipeline', 'cloudformation']
});
```
Then only events where the `eventSource` is that AWS service will be logged.

### Retention
Another way to conserve resources while logging `Break Glass` actions is by setting a retention policy. Set the retention policy to delete logs after a certain period of time. This retention policy applies to all log groups created by the construct - for both log actions and login alerts:
```ts
 new BreakGlassRole(stack, testName, {
    usernames: ["myUser"],
    role: Role.fromRoleName('myRole'),
    retention: RetentionDays.SIX_MONTHS
});
```

## Regions
Since EventBridge rules are regional, in a default implementation alerts and log actions would only be activated when the user assumes the break-glass role in the default region. To ensure that alerts are sent cross-regionally, set the `regions` property:
```ts
    new BreakGlassRole(stack, testName, {
        usernames: ["myUser"],
        regions: ['us-east-2', 'us-west-2'],
        role: Role.fromRoleName('myRole'),
        loginAlertEmails: [
            "myEmail@me.com", 
            "myEmail@example.com", 
            "myEmail@mail.com"
        ]
    });
```
To send login alerts from all regions, set `regions` to `['*']`. To reduce operational overhead, the full EventBridge rule is not replicated in every region. In regions other than the main region, a smaller rule targets an event bus that then reroutes the event to the main region for the alert to be sent.

**Note:** *All log groups will be centrally created in the main region and events from other regions will be routed there and appear in those logs.*

## Break Glass Role Properties

* **usernames** *(required)*: ([string](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#arrays) | [IUser](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.IUser.html))[]

* **role** *(optional)*: [IRole](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.IRole.html)

* **managedPolicies** *(optional)*: [IManagedPolicy[]](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.IManagedPolicy.html)

* **policyStatements** *(optional)*: [PolicyStatement[]](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.PolicyStatement.html)

* **canManageBreakGlassRole** *(optional)*: [boolean](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#the-primitives-string-number-and-boolean)

* **loginAlertEmails** *(optional)*: [string[]](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#arrays)

* **regions** *(optional)*: [string[]](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#arrays)

* **eventBus** *(optional)*: [EventBus](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events.EventBus.html) | [EventBusOptions](lib/types.ts)

* **busRole** *(optional)*: [IRole](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.IRole.html) 

* **retention** *(optional)*: [RetentionDays](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_logs.RetentionDays.html)

* **logActions** *(optional)*: ['read'](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html) | ['write'](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html) | [boolean](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#the-primitives-string-number-and-boolean)

* **logServices** *(optional)*: [string[]](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#arrays)

* **message** *(optional)*: [string](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#the-primitives-string-number-and-boolean) 

* **createLoginLogGroup** *(optional)*: [boolean](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#the-primitives-string-number-and-boolean)

* **deployer** *(optional)*:  [string](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#the-primitives-string-number-and-boolean) | [boolean](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#the-primitives-string-number-and-boolean) | [IRole](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.IRole.html) | [IUser](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.IUser.html) 

## Break-Glass Deployer Permissions
You can optionally use the `deployer` property to set a username, `IUser`, or `Role` as the entity needing permissions to deploy the stacks and initiate the integration tests for the `Break Glass Role`. If `canManageBreakGlassRole` is set to `true`, this role will also give the deployer permission to manage the `BreakGlassRole`.

Setting `deployer` will create a role with Least-Privilege permissions set for deploying the `BreakGlassRole` stack contained herein. That role can then be delegated and used to signin to the AWS account programatically before running `cdk deploy`. If the user or role that deployer is set to already exists in the account, set `deployerExists` to `user` or `role` accordingly so that the construct knows to import them rather than try to create a new one.

## Available Constructs
In addition to the main `BreakGlassRole`, `BreakGlassLoginAlert`, `BreakGlassLogActions`, and `BreakGlassDeployer` are all available as separate constructs. The major difference when using these constructs separately is that the `BreakGlassRole` cannot be created internally and an `IRole` must be passed to them as the `BreakGlassRole`.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.


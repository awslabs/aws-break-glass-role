import { App, Stack } from 'aws-cdk-lib';
import { AccountPrincipal, Role } from 'aws-cdk-lib/aws-iam';
import { BreakGlassLoginAlert } from "../../src/constructs/LoginAlert";
import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import { RequireApproval } from 'aws-cdk-lib/cloud-assembly-schema';
import { env } from '../variables';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

const app = new App();
const stack = new Stack(app, 'integ-login-alert-stack', {env});

new BreakGlassLoginAlert(stack, 'my-integ-login-alert-0', {
  usernames: ["myUser"],
  createLoginLogGroup:true
});

new BreakGlassLoginAlert(stack, 'my-integ-login-alert-1', {
    usernames: ["myUser"],
    loginAlertEmails: ["myEmail@me.com"],
    role: new Role(stack, 'myRole-1', {
        assumedBy: new AccountPrincipal(stack.account),
        roleName: `myRole-1-${env.region}`
    }),
    message: "User <principal> logged in at <eventTime>",
    createLoginLogGroup:true,
    retention: RetentionDays.ONE_DAY
});

new BreakGlassLoginAlert(stack, 'my-integ-login-alert-2', {
    usernames: ["myUser"],
    loginAlertEmails: ["myEmail@me.com"],
    role: new Role(stack, 'myRole-2', {
        assumedBy: new AccountPrincipal(stack.account),
        roleName: `myRole-2-${env.region}`
    }),
    message: "User <principal> logged in at <eventTime>"
});

new BreakGlassLoginAlert(stack, 'my-integ-login-alert-3', {
    usernames: ["myUser"],
    loginAlertEmails: ["myEmail@me.com"],
    role: new Role(stack, 'myRole-3', {
        assumedBy: new AccountPrincipal(stack.account),
        roleName: `myRole-3-${env.region}`
    })
});

new BreakGlassLoginAlert(stack, 'my-integ-login-alert-4', {
    usernames: ["myUser", "myOtherUser"],
    loginAlertEmails: ["myEmail@me.com"]
});

new BreakGlassLoginAlert(stack, 'my-integ-login-alert-5', {
    usernames: ["myUser"],
    loginAlertEmails: ["myEmail@me.com"],
    region:'us-west-2',
    regions: ['us-east-2']
});

new BreakGlassLoginAlert(stack, 'my-integ-login-alert-6', {
    usernames: ["myUser"],
    loginAlertEmails: ["myEmail@me.com", "myEmail@example.com", "myEmail@mail.com"]
});

new IntegTest(app, 'integ-login-alert', {
    testCases: [stack],
    diffAssets: true,
  stackUpdateWorkflow: true,
  cdkCommandOptions: {
    deploy: {
      args: {
        requireApproval: RequireApproval.NEVER,
        json: true,
      },
    },
    destroy: {
      args: {
        force: true,
      },
    },
  },
});

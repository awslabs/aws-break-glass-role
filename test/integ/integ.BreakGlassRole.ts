import { App, Stack } from 'aws-cdk-lib';
import { AccountPrincipal, Effect, ManagedPolicy, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { BreakGlassRole } from "../../lib/constructs/BreakGlassRole";
import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import { RequireApproval } from 'aws-cdk-lib/cloud-assembly-schema';
import { env } from '../variables';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

const app = new App();
const stack = new Stack(app, 'integ-break-glass-role-stack', {env});

new BreakGlassRole(stack, 'my-integ-break-glass-role-1', {
  usernames: ["myUser"],
  role: new Role(stack, 'myRole-1', {
    assumedBy: new AccountPrincipal(stack.account),
    roleName: `myRole-1-${env.region}`
    }),
    loginAlertEmails: ["myEmail@me.com", "myEmail@example.com", "myEmail@mail.com"],
    logActions: true,
    retention: RetentionDays.ONE_DAY
});

new BreakGlassRole(stack, 'my-integ-break-glass-role-2', {
    usernames: ["myUser"],
    role: new Role(stack, 'myRole-2', {
        assumedBy: new AccountPrincipal(stack.account),
        roleName: `myRole-2-${env.region}`
    }),
    logActions: 'write',
    retention: RetentionDays.ONE_DAY,
    logServices: ['codepipeline', 'cloudformation']

});

new BreakGlassRole(stack, 'my-integ-break-glass-role-3', {
    usernames: ["myUser"],
    role: new Role(stack, 'myRole-3', {
        assumedBy: new AccountPrincipal(stack.account),
        roleName: `myRole-3-${env.region}`
    }),
    logActions: true,
    retention: RetentionDays.ONE_DAY
});

new BreakGlassRole(stack, 'my-integ-break-glass-role-4', {
    usernames: ["myUser"],
    role: new Role(stack, 'myRole-4', {
        assumedBy: new AccountPrincipal(stack.account),
        roleName: `myRole-4-${env.region}`
    }),
    loginAlertEmails: ["myEmail@me.com", "myEmail@example.com", "myEmail@mail.com"]
});

new BreakGlassRole(stack, 'my-integ-break-glass-role-5', {
    usernames: ["myUser", "myOtherUser"],
    managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('job-function/ViewOnlyAccess')],
    policyStatements: [
      new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['s3:Get*', 's3:PutObject'],
          resources: ['*']
      })
    ]
});

new BreakGlassRole(stack, 'my-integ-break-glass-role-6', {
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
});

new BreakGlassRole(stack, 'my-integ-break-glass-role-7', {
    usernames: ["myUser"],
    managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('job-function/ViewOnlyAccess')]
  }
);

new BreakGlassRole(stack, 'my-integ-break-glass-role-8', {
    usernames: ["myUser"]
  }
);

new BreakGlassRole(stack, 'my-integ-break-glass-role-9', {
    usernames: ["myUser"],
    role: new Role(stack, 'myRole-9', {
        assumedBy: new AccountPrincipal(stack.account),
        roleName: `myRole-9-${env.region}`
    })
  }
);

new IntegTest(app, 'integ-break-glass-role', { 
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
import { App, Stack } from 'aws-cdk-lib';
import { AccountPrincipal, Role } from 'aws-cdk-lib/aws-iam';
import { BreakGlassLogActions } from "../../src/constructs/log-actions";
import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import { RequireApproval } from 'aws-cdk-lib/cloud-assembly-schema';
import { env } from '../variables';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

const app = new App();
const stack = new Stack(app, 'integ-log-actions-stack', {env});

new BreakGlassLogActions(stack, 'my-integ-log-actions-1', {
  usernames: ["myUser"],
  retention: RetentionDays.ONE_DAY
});

new BreakGlassLogActions(stack, 'my-integ-log-actions-2', {
    usernames: ["myUser"],
    logActions: 'read',
    role: new Role(stack, 'myRole-1', {
        assumedBy: new AccountPrincipal(stack.account),
        roleName: `myRole-1-${env.region}`
    }),
    retention: RetentionDays.ONE_DAY
});

new BreakGlassLogActions(stack, 'my-integ-log-actions-3', {
    usernames: ["myUser"],
    logActions: 'write',
    retention: RetentionDays.ONE_DAY
});

new BreakGlassLogActions(stack, 'my-integ-log-actions-4', {
    usernames: ["myUser"],
    logServices: ['codepipeline', 'cloudformation'],
    retention: RetentionDays.ONE_DAY
});

new BreakGlassLogActions(stack, 'my-integ-log-actions-5', {
    usernames: ["myUser", "myOtherUser"],
    logServices: ['codepipeline', 'cloudformation'],

    retention: RetentionDays.ONE_DAY
});

new IntegTest(app, 'integ-log-actions', {
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

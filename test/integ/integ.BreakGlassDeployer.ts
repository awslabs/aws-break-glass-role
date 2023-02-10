import { App, Stack } from 'aws-cdk-lib';
import { AccountRootPrincipal, Role, User } from 'aws-cdk-lib/aws-iam';
import { BreakGlassDeployer } from "../../lib/constructs/Deployer";
import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import { RequireApproval } from 'aws-cdk-lib/cloud-assembly-schema';
import { env } from '../variables';

const app = new App();
const stack = new Stack(app, 'integ-deployer-stack', {env});

new BreakGlassDeployer(stack, 'my-integ-deployer-1', {
    assumedBy: new Role(stack, 'myRole-deployer-1', {
        roleName:'myRole-deployer-1',
        assumedBy: new AccountRootPrincipal()
    })
});

new BreakGlassDeployer(stack, 'my-integ-deployer-2', {
    assumedBy: new User(stack, 'myUser-2', {userName:'myUser-2'})
});

new BreakGlassDeployer(stack, 'my-integ-deployer-3', {
    assumedBy: 'integ-role',
    exists: 'role'
});

new BreakGlassDeployer(stack, 'my-integ-deployer-4', {
    assumedBy: 'integ-user',
    exists: 'user'
});

new BreakGlassDeployer(stack, 'my-integ-deployer-5', {
    assumedBy: 'myUser-5'
});

new BreakGlassDeployer(stack, 'my-integ-deployer-6');


new IntegTest(app, 'integ-deployer', { 
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
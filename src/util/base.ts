import { Resource, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BreakGlassProps } from '../types';
import * as Regions from './json/regions.json';
import { IManagedPolicy, IUser } from 'aws-cdk-lib/aws-iam';
export class BreakGlassBase extends Resource {
  mainRegion: string;
  props: BreakGlassProps
  protected policyCount = 0;
  constructor(protected scope: Construct, protected id: string, props: BreakGlassProps) {
    super(scope,id, {
      physicalName: id
    });
    this.props = {
      ...props,
      region: props.region || Stack.of(this).region || 'us-east-1',
      regions: this.setRegions(props)
    }
  }

  get usernames(): string[] {
    return this.props.usernames.map(user => {
      if (typeof user === 'string') return user;
      if (user.hasOwnProperty('userName')) return (user as IUser).userName;
      throw new Error('Invalid User Name');
    });
  }

  protected setRegions(props:BreakGlassProps): string[] | undefined {
    if (props.regions?.length === 1 && props.regions[0] === '*') {
      return Regions;
    }
    return props.regions;
  }

  protected adminWarn(policies?: IManagedPolicy[]) {
    if ((policies || []).some(pol => pol.managedPolicyArn.indexOf('AdministratorAccess') > -1)) {
      console.warn("You have chosen to give Break Glass Users Administrative Access. It is strongly recommended to follow the Least Privilege access principle even when configuring break glass roles. For more info see 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#grant-least-privilege'");
    }
  }
}

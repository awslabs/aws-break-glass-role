import { BreakGlassConstructBase } from "../util/construct-base";
import { BreakGlassLogActionsProps } from "../types";
import { LogActionsRule } from "../events/rules/log-actions";
import { Construct } from "constructs";
import { BreakGlassRuleBase } from "../util/rule-base";

export class BreakGlassLogActions extends BreakGlassConstructBase {

    constructor(scope:Construct,id:string,props:BreakGlassLogActionsProps) {
        super(scope,id,props);
    }
    protected setRule(region: string, name: string): BreakGlassRuleBase {

        return new LogActionsRule(this.scope, name, {
            usernames: this.usernames,
            eventBus: this.eventBus,
            busRole: this.targetBusRole,
            region,
            retentionDays: this.props.retention,
            mainRegion: this.mainRegion,
            logActions: this.props.logActions,
            logServices: this.props.logServices,
            role: this.role,
        });
    }
}
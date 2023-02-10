import { BreakGlassConstructBase } from "../util/construct-base";
import { BreakGlassBaseProps, EventPatternField } from "../types";
import { LogActionsRule } from "../events/rules/log-actions";
import { Construct } from "constructs";

export interface BreakGlassLogActionsProps extends BreakGlassBaseProps {
    logActions?: 'read' | 'write' | boolean
    logServices?: string[]
}

export class BreakGlassLogActions extends BreakGlassConstructBase {

    constructor(scope:Construct,id:string,props:BreakGlassLogActionsProps) {
        super(scope,id,props);
    }
    protected setRule(region: string, name: string): LogActionsRule {

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
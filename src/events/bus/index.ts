import { EventBus } from "aws-cdk-lib/aws-events";
import { Construct } from "constructs";
import { EventBusOptions } from "../../types";

export class BreakGlassEventBus extends EventBus {
    
    constructor(scope: Construct, id: string, props?:EventBusOptions) {
        super(scope,id, {
            eventBusName: props?.type === 'source' ? undefined : props?.value || id,
            eventSourceName: props?.type !== 'source' ? undefined : props?.value
        });
    }
}
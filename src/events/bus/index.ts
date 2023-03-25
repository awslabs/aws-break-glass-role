import { EventBus } from "aws-cdk-lib/aws-events";
import { Construct } from "constructs";
import { IEventBusOptions } from "../../types";

export class BreakGlassEventBus extends EventBus {
    
    constructor(scope: Construct, id: string, props?:IEventBusOptions) {
        super(scope,id, {
            eventBusName: props?.fieldType === 'source' ? undefined : props?.fieldValue || id,
            eventSourceName: props?.fieldType !== 'source' ? undefined : props?.fieldValue
        });
    }
}
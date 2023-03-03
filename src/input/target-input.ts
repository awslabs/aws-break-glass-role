import { EventField, RuleTargetInput } from "aws-cdk-lib/aws-events"

export interface EventInput {
    [name:string]: string
}

export interface TargetInput {
    event: EventInput
    message?: string
}

export class BreakGlassTargetInput {
    readonly event: EventInput
    readonly rawEvent: EventInput;
    readonly message?: string

    static getTarget(msg?:string, additionalEvents?:EventInput): RuleTargetInput {
        return (new BreakGlassTargetInput(msg,additionalEvents)).getTarget();
    }

    constructor(protected rawMessage?: string, additionalEvents?:EventInput) {
        this.rawEvent = this.getEvent(additionalEvents);
        const { event, message} = this.getMessageEvent(rawMessage);
        this.event = event;
        this.message = message;
    }

    getTarget(): RuleTargetInput {
        return this.message ? 
            RuleTargetInput.fromText(this.message) : 
            RuleTargetInput.fromObject(this.event);
    }

    getRawEventTarget(): RuleTargetInput {
        return RuleTargetInput.fromObject(this.rawEvent)
    }

    protected getMessageEvent(message?:string): TargetInput {
        const event = {};
        if (!message) return {event: this.rawEvent};
        let regex, $event = this.rawEvent;
        while (regex = /\<([^\>]*)\>/g.exec(message)) {
            const str =  $event[regex[1] as keyof EventInput];
            if (!str) continue;
            message = message.replace(regex[0], str);
            event[regex[1]] = $event[regex[1]];
        }
        return {event,message}
    }

    protected getEvent(additionalEvents: EventInput = {}): EventInput {
        return {
            username: EventField.fromPath('$.detail.userIdentity.arn'),
            principal:  EventField.fromPath('$.detail.userIdentity.principalId'),
            account: EventField.fromPath('$.detail.userIdentity.accountId'),
            source: EventField.fromPath('$.source'),
            eventName: EventField.fromPath('$.detail.eventName'),
            eventSource: EventField.fromPath('$.detail.eventSource'),
            eventTime: EventField.fromPath('$.detail.eventTime'),
            eventCategory: EventField.fromPath('$.detail.eventCategory'),
            eventType: EventField.fromPath('$.detail.eventType'),
            region: EventField.fromPath('$.detail.awsRegion'),
            readonly: EventField.fromPath('$.detail.readonly'),
            detailType: EventField.fromPath('$.detail-type'),
            eventId: EventField.fromPath('$.eventId'),
            requestId: EventField.fromPath('$.requestId'),
            ip: EventField.fromPath('$.detail.sourceIPAddress'),
            userAgent: EventField.fromPath('$.detail.userAgent'),
            ...additionalEvents
        }
    }
}
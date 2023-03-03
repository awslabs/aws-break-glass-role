const { CloudWatchLogs } = require('aws-sdk');
module.exports = (...regions) => {
    regions.forEach(region => {
        const logs = new CloudWatchLogs({
            region,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });
        logs.describeLogGroups({}, (err, data) => {
            if (err) console.error(err);
            if (data && data.logGroups) {
                const logGroups = data.logGroups;
                (logGroups || []).forEach(logGroup => {
                    if (err) console.error(err);
                    if (
                        /integ\-/.test(logGroup.logGroupName) &&
                        !(/do.?not.?delete.?/i.test(logGroup.logGroupName))
                    ) {
                        logs.deleteLogGroup({logGroupName: logGroup.logGroupName}, (err) => {
                            if (err) {
                                console.log(`Could not delete log group ${logGroup.logGroupName}`)
                                console.error(err);
                            } else console.log(`Deleted log group ${logGroup.logGroupName}`)
                        });
                    } else console.log(`Skipping deletion of log group ${logGroup.logGroupName}`)
                })
            } else console.log(`No Log Groups found for ${region}`);
        });
    });
}
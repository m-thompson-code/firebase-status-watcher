var firebaseStatusWatcherCron = require('./firebaseStatusWatcherCron.js');

// lambda-local -l index.js -h handler -e index.js -t 60
exports.handler = async (event) => {
    return firebaseStatusWatcherCron().then(body => {
        // aws lambda response requires statusCode<number> and body<string>
        // source: https://aws.amazon.com/premiumsupport/knowledge-center/malformed-502-api-gateway/
        const response = {
            statusCode: 200,
            body: JSON.stringify(body)
        };
        return response;
    }).catch(error => {
        // aws lambda response requires statusCode<number> and body<string>
        // source: https://aws.amazon.com/premiumsupport/knowledge-center/malformed-502-api-gateway/
        const response = {
            statusCode: 500,
            body: JSON.stringify({
                error: error,
                successful: false,
                timestamp: Date.now()
            })
        };
        return response;
    });
};

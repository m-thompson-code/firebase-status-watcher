var getFirebaseStatus = require('./getFirebaseStatus.js');

// lambda-local -l index.js -h handler -e index.js
exports.handler = async (event) => {
    return getFirebaseStatus().then(body => {
        // aws lambda response requires statusCode<number> and body<string>
        // source: https://aws.amazon.com/premiumsupport/knowledge-center/malformed-502-api-gateway/
        const response = {
            statusCode: 200,
            body: JSON.stringify(body)
        };
        return response;
    }).catch(error => {
        // Crawling failed or some other error occurred

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

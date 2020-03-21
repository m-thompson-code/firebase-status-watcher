// source: http://mongodb.github.io/node-mongodb-native/3.1/quick-start/quick-start/#find-all-documents
const MongoClient = require('mongodb').MongoClient;

// source: https://www.npmjs.com/package/request-promise
// source: https://github.com/request/request-promise-native
var rp = require('request-promise-native');

// source: https://github.com/firebase/functions-samples/blob/Node-8/email-confirmation/functions/index.js
// source: https://nodemailer.com/about/
const nodemailer = require('nodemailer');

// Secret information that is better hidden behind Environment variables
// This config includes the url to my database, dbname, email, and password
/*

module.exports = {
    mongodbUrl: <TODO: replace>,
    dbName: <TODO: replace>,
    email: <TODO: replace>,
    password: <TODO: replace>,
    myEmailAddress: <TODO: replace>,
}

*/
const config = require('./config');

// Database Name
const dbName = config.dbName;

// Connection URL
const url = config.mongodbUrl;

// Configure the email transport using the default SMTP transport and a GMail account.
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
const gmailEmail = config.email;
const gmailPassword = config.password;

module.exports = () => {
    var promises = [];
    var prevServices = {};
    var newServices = {};
    var newStatuses = {};

    // Firebase services we want to monitor
    var monitoredServices = ['Authentication', 'Cloud Messaging', 'Console', 'Cloud Functions', 'Hosting', 'Realtime Database', 'Storage'];
    var changedServices = [];



    // Create a new MongoClient
    const client = new MongoClient(url);



    const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword,
    },
    });

    var db = null;

    // Use connect method to connect to the mongodb server
    return client.connect().then(() => {
        console.log("Connected successfully to server");

        // Connect to the database by name
        db = client.db(dbName);

        var options = {
            method: 'GET',
            uri: config.firebaseStatusUrl,
            json: true // Automatically parses the JSON string in the response
        };
        
        // Get the current firebase service statuses
        promises.push(rp(options).then(parsedBody => {
            newStatuses = parsedBody && parsedBody.services || {};
        }));

        // Find all existing firebase services currently in mongodb database
        promises.push(findDocuments(db).then(docs => {
            // Setup a map of each service by their service name
            for (var i = 0; i < docs.length; i++) {
                prevServices[docs[i].service] = {
                    service: docs[i].service,
                    status: docs[i].status,
                    timestamp: docs[i].timestamp
                }
            }
        }));

        return Promise.all(promises);
    }).then(() => {
        var updatePromises = [];

        // Prepare an update to each new firebase service status
        for (var key of Object.keys(newStatuses || {})) {
            var filter = {service: key};
            newServices[key] = {
                service: key,
                status: newStatuses[key],
                timestamp: Date.now()
            };

            // update mongodb database
            updatePromises.push(updateDocument(db, filter, {$set: newServices[key]}));
        }

        return Promise.all(updatePromises);
    }).then(() => {
        // Close connection to mongodb since we no longer need to read / write to database
        client.close();

        var overallStatus = "Normal Operations";

        // Collect which services have changed into changedServices
        for (var i = 0; i < monitoredServices.length; i++) {
            var service = monitoredServices[i];
            if (!newServices[service] || !newServices[service].status) {
                newServices[service] = {
                    service: service,
                    status: "Not Found",
                    timestamp: Date.now()
                };
            }

            if (newServices[service] && prevServices[service] && newServices[service].status !== prevServices[service].status) {
                changedServices.push(newServices[service]);
            }

            if (newServices[service].status === "Service Outage") {
                overallStatus = "Service Outage";
            } else if (newServices[service].status === "Service Disruption" && overallStatus === "Normal Operations") {
                overallStatus = "Service Disruption";
            }
        }

        // Generate html email

        var statusColor = {
            "Not Found": "#ff3300",
            "Unknown Status": "#ff3300",
            "Service Outage": "#ff3300",
            "Service Disruption": "#ff9800",
            "Normal Operations": "#0da960"
        };

    var htmlEmail = `<div>
        <div style="padding-bottom: 12px; color: #303030">
            Overall monitored services status: <span style="color: ` + statusColor[overallStatus] + `">` + overallStatus + `</span>
        </div>
        <div style="padding-bottom: 12px; color: #303030">
            <a href="https://status.firebase.google.com/">Firebase Status Dashboard</a>
        </div>`;
        
        for (var i = 0; i < monitoredServices.length; i++) {
            var service = monitoredServices[i];
    htmlEmail += `<div style="padding-bottom: 12px; color: #303030">` + newServices[service].service + `: <span style="color: ` + statusColor[newServices[service].status] + `">` + newServices[service].status + `</span>
    </div>`;
        }
    htmlEmail += `</div>`;

        // End generate html email

        // Generate text email
        var textEmail = "Overall monitored services status: " + overallStatus + "\n";
        textEmail += "Firebase Status Dashboard url: https://status.firebase.google.com/ \n"
        for (var i = 0; i < monitoredServices.length; i++) {
            var service = monitoredServices[i];
            textEmail += newServices[service].service + ": " + newServices[service].status + "\n";
        }
        // End Generate text email

        // Send email which the new firebase service statuses
        var emailPromises = [];
        if (changedServices.length) {
            var mailOptions = {
                from: '"Firebase Status Watcher" <firebase.status.watcher@gmail.com>',
                to: myEmailAddress,
                subject: "Firebase services status changed: " + overallStatus,
                text: textEmail,
                html: htmlEmail
            };

            emailPromises.push(mailTransport.sendMail(mailOptions).then(() => {
                console.log('email successful');
            }));
        }
            
        return Promise.all(emailPromises);
    }).then(() => {
        // source: https://aws.amazon.com/premiumsupport/knowledge-center/malformed-502-api-gateway/
        const response = {
            statusCode: 200,
            body: JSON.stringify({
                'changedServices': changedServices
            })
        };
        return response;
    }).catch(error => {
        console.error("error", error);
        // source: https://aws.amazon.com/premiumsupport/knowledge-center/malformed-502-api-gateway/
        const response = {
            statusCode: 500,
            body: JSON.stringify({
                error: error
            })
        };
        return response;
    });

}

function findDocuments (db) {
    // Get the documents collection
    const collection = db.collection('firebase-status-watcher');
    // Find some documents
    return collection.find({}).toArray().then(docs => {
      console.log("Found the following records");
      console.log(docs)
      return docs;
    });
  }

function updateDocument (db, filter, update) {
    // Get the documents collection
    const collection = db.collection('firebase-status-watcher');
    // Insert some documents
    return collection.updateOne(filter, update, {upsert: true});
}

# Firebase Status Watcher

When working on firebase during its earlier years. It went down a lot, and it was somewhat annoying to have to check its status page every few hours to make sure it wasn't down. So I created a cron that did it for me. I also learned that there was a free service that did exactly this already, so I stopped maintaining this project all together.

For those looking for a way to get informed when Firebase Services go down, take a look at StatusGator: https://statusgator.com/

One of the services they monitor is Firebase, but they also monitor many other services too.



## Info

This project runs a script that will crawl the Firebase status page: https://status.firebase.google.com/

Depending on what services are listed in firebaseStatusWatcherCron/firebaseStatusWatcherCron.js (monitoredServices) an email will be sent to an email address (myEmailAddress in config.js)

This project also stores the results of services going out or recoverying into a mongo DB.

Please update with a config.js at the root of the project

This project used to be deployed on a cron task using AWS.

config.js
module.exports = {
    mongodbUrl: 'mongodb://<username>:<password>@<address>/firebase-status-watcher',
    dbName: 'firebase-status-watcher',
    email: "<sender email>",
    password: "<sender email password>",
    firebaseStatusUrl: "<endpoint for firebase status cron>",
    myEmailAddress: "<receiving email>"
};

# Firebase Status Watcher

When working on firebase during its earlier years, many services would go out often, and it was annoying to have to check Firebase"s service status page (https://status.firebase.google.com/) every few hours. So I created a cron that did it for me. I later learned that there was a free service that did this already, so I stopped maintaining this project all together.

For those looking for a way to get informed when Firebase Services go down, take a look at StatusGator: https://statusgator.com/

They monitor Firebase and many other services too. If a service goes down or goes back up, they"ll email you for free.

## Info and configuration instructions

This project runs a script that will crawl the Firebase status page: https://status.firebase.google.com/

Depending on what services are listed in firebaseStatusWatcherCron/firebaseStatusWatcherCron.js (monitoredServices), an email will be sent to an email address (myEmailAddress in config.js)

This project also stores the results of services going out / going back up into a mongo DB.

Please update with a config.js at the root of the project:

```
// config.js
module.exports = {
    mongodbUrl: "mongodb://<username>:<password>@<address>/firebase-status-watcher",
    dbName: "firebase-status-watcher",
    email: "<sender email>",
    password: "<sender email password>",
    firebaseStatusUrl: "<endpoint for firebase status cron>",
    myEmailAddress: "<receiving email>"
};
```

This project was used to be deployed on a cron task using AWS.

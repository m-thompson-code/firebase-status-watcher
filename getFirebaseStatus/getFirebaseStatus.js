// source: https://github.com/jxck/html2json#readme
var html2json = require('html2json').html2json;

// source: https://www.npmjs.com/package/request-promise
// source: https://github.com/request/request-promise-native
var rp = require('request-promise-native');

module.exports = () => {
    // Crawl the firebase status page
    return rp('https://status.firebase.google.com/').then(htmlString => {
        // Process html...
        var sourceHtml = html2json("<moo>" + htmlString.trim() + "</moo>");

        // Find the timeline table on the firebase status page
        var timelineTable = getTimelineTable(sourceHtml);

        // generate an array of firebase services and statues
        // We assume that the order should be service, status, service, status, etc
        var results = getFirebaseStatusesFromHtml(timelineTable);

        var services = {};

        // Attempt to pair service with status
        for (var i = 0; i < results.length; i++) {
            var result = results[i];

            if (result.service) {
                services[result.service] = "Unknown Status";
            } else if (result.status) {
                if (!results[i - 1] || !results[i - 1].service) {
                    services["Unknown service"] = services["Unknown service"] || [];
                    services["Unknown service"].push(result.status);
                } else {
                    services[results[i - 1].service] = result.status;
                }
            }
        }

        return {
            services: services,
            successful: true,
            timestamp: Date.now()// Used to ensure no caching of the previous request is happening 
        }
    });
}

// Web page crawl for the timeline table
function getTimelineTable(element) {
    // Handle unexpected missing element
    if (!element) {
        return null;
    }

    // The timeline table has class 'timeline-table'
    if (element && element.tag === 'table' && element.attr && element.attr.class && element.attr.class.indexOf('timeline-table') !== -1) {
        return element;
    }

    // Iterate over all elements and their children for timeline table
    if (element.child && element.child.length) {
        for (var i = 0; i < element.child.length; i++) {
            var timelineTable = getTimelineTable(element.child[i]);
            if (timelineTable) {
                return timelineTable;
            }
        }
    }

    // Return null if no table was found
    return null;
}

// Web page crawl for services and statuses
function getFirebaseStatusesFromHtml(element, results) {
    if (!element) {
        return null;
    }

    // Carry results as we use getFirebaseStatusesFromHtml recursively
    results = results || [];

    // All services are td elements with class "service-status"
    if (element.attr && element.attr.class) {
        if (element.attr.class.indexOf("service-status") !== -1) {
            if (element.child) {
                var service = "";

                for (var i = 0; i < element.child.length; i++) {
                    if (element.child[i].node === "text" && element.child[i].text) {
                        service += element.child[i].text.replace(/\\n/g, '').trim();
                    }
                }

                results.push({
                    service: service || "Unknown service"
                });
            }
        }

        // All statuses are spans within a td element with class "col8"
        if (element.attr.class.indexOf("col8") !== -1) {
            if (element.child) {
                for (var k = 0; k < element.child.length; k++) {
                    if (element.child[k].tag === 'span') {
                        var status = null;

                        if (element.child[k].attr.class.indexOf('high') !== -1) {
                            status = "Service Outage";
                        } else if (element.child[k].attr.class.indexOf('medium') !== -1) {
                            status = "Service Disruption";
                        } else if (element.child[k].attr.class.indexOf('ok') !== -1) {
                            status = "Normal Operations";
                        }

                        results.push({
                            status: status || "Unknown Status"
                        });
                    }
                }
            }
        }
    }

    // Iterate over all elements and their children for services and statuses
    if (element.child && element.child.length) {
        for (var i = 0; i < element.child.length; i++) {
            getFirebaseStatusesFromHtml(element.child[i], results);
        }
    }

    return results;
}

var readFeed = require('feed-read'),
    _ = require('underscore'),
    util = require('util');

var AWS_RSS_PREFIX = 'http://status.aws.amazon.com/rss/';

var AWS_STATUS = {
    'normal': 'Service is operating normally',
    'error' : 'Informational message'
};


function getServiceRegionStatus(service, region, cb){
    var result = {
        'cloudProvider' : 'aws',
        'region' : region,
        'service' : service,
    }, feedURl;

     if(region){
        feedUrl = util.format('%s%s-%s.rss', AWS_RSS_PREFIX, service, region);
     }
     else{
        feedUrl = util.format('%s%s.rss', AWS_RSS_PREFIX, service, region);
     }

    readFeed(feedUrl, function(err, data){
        if(err){
            cb(new Error(util.format('Failed to get status for aws-%s-%s', service, region)));
            return;
        }
        if(data && _.isArray(data) && !_.isEmpty(data)){
            //we have some event in the RSS feed. looking at the first event to get status update.
            var lastEvent = data[0];
            var status = {
                'major' : lastEvent.title.split(": ")[0],
                'minor' : lastEvent.title.split(": ")[1]
            };
            _.extend(result, {
                'lastUpdated' : lastEvent.published
            });
            if(AWS_STATUS['normal'] === status.major){
                _.extend(result, {
                    'statusCode' : 1,
                    'statusMessage' : AWS_STATUS['normal']
                });
            }
            else{
                    _.extend(result, {
                        'statusCode' : 0,
                        'statusMessage' :status.minor,
                        'statusDescription' : lastEvent.content
                    });
            }

        }
        else{
            //nothing in the feed, all good :)
            _.extend(result, {
                'statusCode' : 1,
                'statusMessage' : AWS_STATUS['normal']
             });

        }
        cb(null, result);
     });
}

var cloud = {

     getStatus : function(tasks, done){
        var length = tasks.length, cbCount = 0;
        var errArray = [], resultArray = [];

        if(length === 0){
            done(errArray, resultArray);
            return;
        }

        function statusCallback(err, result){
            cbCount++;
            if(err){
                errArray.push(err);
            }
            else{
                resultArray.push(result);
            }

            if(cbCount === length){
                done(errArray, resultArray);
            }
        }

        _.each(tasks, function(task){
            getServiceRegionStatus(task.service, task.region, statusCallback);
        });
     }
};

module.exports = cloud;
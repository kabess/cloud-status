var _ = require('underscore'),
    util = require('util'),
    cloudProviders = {
        'aws' : require('./aws.js')
    };


var self = {
    getStatus : function(settings, done){
        var providerTasks = _.groupBy(settings, function(providerTask){ return providerTask.cloudProvider }),
            totalErrors = [], totalResults = [], providerCounter = 0;

        function providerCallback(err, result){

            providerCounter++;
            totalErrors = totalErrors.concat(err);
            totalResults = totalResults.concat(result);

            if(providerCounter === _.keys(providerTasks).length){
                done(totalErrors.length === 0 ? null : totalErrors, totalResults);
            }
        }

        _.each(_.keys(providerTasks), function(cloudProvider){
            var cloud = cloudProviders[cloudProvider];
            if(cloud){
                cloud.getStatus(providerTasks[cloudProvider], providerCallback);
            }
            else{
                providerCounter++;
                totalErrors.push(new Error(util.format('CloudProvider \'%s\' is not supported!', cloudProvider)));
            }
        });
    }
};

module.exports = self;
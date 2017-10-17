"use strict";

var AWS = require('aws-sdk');

class proponojs {
  constructor(config) {
    this.config = config;
    // e.g. {region: 'REGION', credentials: {/* */}}
    AWS.config.update(config);
  }

  publish (topic, message, cb) {
    var sns = new AWS.SNS();

    var params = {
      Name: topic
    };
    sns.createTopic(params, function(err, data) {
      if (err) {
        console.log(err, err.stack); 
        cb(err);
      } else {
        cb(null,data);
      }
    });
  }
}

// we export the class instance via a function call
module.exports = (config) => {
  return new proponojs (config);
};

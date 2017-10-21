const AWS = require('aws-sdk');

class ProponoJS {
  constructor(config) {
    this.config = config;

    // e.g. {region: 'REGION', credentials: {/* */}}
    AWS.config.update(config);
  }

  publish(topic, message, cb) { // eslint-disable-line class-methods-use-this
    const sns = new AWS.SNS();

    const params = {
      Name: topic,
    };
    sns.createTopic(params, (err, data) => {
      if (err) {
        // console.log(err, err.stack);
        cb(err);
      } else {
        cb(null, data);
      }
    });
  }
}

// we export the class instance via a function call
module.exports = function proponojs(config) {
  return new ProponoJS(config);
};

const AWS = require('aws-sdk');

const shortid = require('shortid');

class ProponoJS {
  constructor(config) {
    this.config = config;
    AWS.config.update(config);
  }

  publish(topic, message, cb) { // eslint-disable-line class-methods-use-this
    const sns = new AWS.SNS();
    const createParams = {
      Name: topic,
    };
    sns.createTopic(createParams, (createErr, createData) => {
      if (createErr) {
        cb(createErr);
      } else {
        const topicArn = createData.TopicArn;

        const body = {
          id: shortid.generate(),
          message,
        };

        const publishParams = {
          Message: JSON.stringify(body),
          TopicArn: topicArn,
        };

        sns.publish(publishParams, (publishErr, publishData) => {
          if (publishErr) {
            cb(publishErr);
          } else {
            cb(null, publishData);
          }
        });
      }
    });
  }
}

// Export the class instance via a function call
module.exports = function proponojs(config) {
  return new ProponoJS(config);
};

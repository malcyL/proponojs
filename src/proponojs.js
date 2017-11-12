const AWS = require('aws-sdk');
const Consumer = require('sqs-consumer');

const shortid = require('shortid');

class ProponoJS {
  constructor(config) {
    this.config = config;
    AWS.config.update(config);
  }

  publish(topic, message, cb) { // eslint-disable-line class-methods-use-this
    this.createSnsTopic(topic, (createErr, topicArn) => {
      if (createErr) {
        cb(createErr);
      } else {
        const body = {
          id: shortid.generate(),
          message,
        };

        const publishParams = {
          Message: JSON.stringify(body),
          TopicArn: topicArn,
        };

        const sns = new AWS.SNS();
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

  listen(topic, processMessage) {
    this.createTopicQueueAndSubscription(topic, (createErr, queueUrl) => {
      if (createErr) {
        throw createErr;
      } else {
        const app = Consumer.create({
          queueUrl,
          handleMessage: (message, done) => {
            const body = JSON.parse(message.Body);
            const payload = JSON.parse(body.Message);
            processMessage(payload.message, done);
          },
          sqs: new AWS.SQS(),
        });

        // app.on('error', (err) => {
        //   console.log(err.message);
        // });

        app.start();
      }
    });
  }

  createTopicQueueAndSubscription(topic, cb) {
    this.createSnsTopic(topic, (createSnsErr, topicArn) => {
      if (createSnsErr) {
        cb(createSnsErr);
      } else {
        this.createSqsQueue(topic, (createSqsErr, queueUrl, queueArn) => {
          if (createSqsErr) {
            cb(createSqsErr);
          } else {
            this.subscribeSqsToSns(topicArn, queueArn, (subscribeErr) => {
              if (subscribeErr) {
                cb(subscribeErr);
              } else {
                this.setSqsPolicy(topicArn, queueUrl, queueArn, (policyErr) => {
                  if (policyErr) {
                    cb(policyErr);
                  } else {
                    cb(null, queueUrl);
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  createSnsTopic(topic, cb) { // eslint-disable-line class-methods-use-this
    const sns = new AWS.SNS();
    const createParams = {
      Name: topic,
    };
    sns.createTopic(createParams, (createErr, createData) => {
      // console.log('Create Topic err: ' + JSON.stringify(createErr));
      // console.log('Create Topic data: ' + JSON.stringify(createData));
      if (createErr) {
        cb(createErr);
      } else {
        cb(null, createData.TopicArn);
      }
    });
  }

  createSqsQueue(topic, cb) {
    const sqs = new AWS.SQS();
    const params = { QueueName: this.queueName(topic) };
    sqs.createQueue(params, (createErr, createData) => {
      // console.log('Create Queue err: ' + JSON.stringify(createErr));
      // console.log('Create Queue data: ' + JSON.stringify(createData));
      if (createErr) {
        cb(createErr);
      } else {
        this.getQueueAttributes(createData.QueueUrl, (getAttributesErr, queueArn) => {
          if (getAttributesErr) {
            cb(getAttributesErr);
          } else {
            cb(null, createData.QueueUrl, queueArn);
          }
        });
      }
    });
  }

  getQueueAttributes(queueUrl, cb) { // eslint-disable-line class-methods-use-this
    const params = {
      QueueUrl: queueUrl,
      AttributeNames: [
        'QueueArn',
      ],
    };
    const sqs = new AWS.SQS();
    sqs.getQueueAttributes(params, (getErr, getData) => {
      if (getErr) {
        cb(getErr);
      } else {
        // console.log('Get Queue data: ' + JSON.stringify(getData));
        cb(null, getData.Attributes.QueueArn);
      }
    });
  }

  subscribeSqsToSns(topicArn, queueArn, cb) { // eslint-disable-line class-methods-use-this
    const params = {
      Protocol: 'sqs',
      TopicArn: topicArn,
      Endpoint: queueArn,
    };
    const sns = new AWS.SNS();
    sns.subscribe(params, (err) => {
      if (err) {
        cb(err);
      } else {
        cb();
      }
    });
  }

  setSqsPolicy(topicArn, queueUrl, queueArn, cb) {
    const params = {
      QueueUrl: queueUrl,
      Attributes: {
        Policy: JSON.stringify(this.generatePolicy(topicArn, queueArn)),
      },
    };
    const sqs = new AWS.SQS();
    sqs.setQueueAttributes(params, (err) => {
      if (err) {
        cb(err);
      } else {
        cb();
      }
    });
  }

  generatePolicy(topicArn, queueArn) { // eslint-disable-line class-methods-use-this
    return {
      Version: '2008-10-17',
      Id: `${queueArn}/SQSDefaultPolicy`,
      Statement: [
        {
          Sid: `${queueArn}-Sid`,
          Effect: 'Allow',
          Principal: {
            AWS: '*',
          },
          Action: 'SQS:*',
          Resource: `${queueArn}`,
          Condition: {
            StringEquals: {
              'aws:SourceArn': `${topicArn}`,
            },
          },
        },
      ],
    };
  }

  queueName(topic) {
    return `${this.config.applicationName}-${topic}${this.config.queueSuffix}`;
  }
}

// Export the class instance via a function call
module.exports = function proponojs(config) {
  return new ProponoJS(config);
};

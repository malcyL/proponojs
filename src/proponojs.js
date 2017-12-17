const AWS = require('aws-sdk');
const async = require('async');
const shortid = require('shortid');

class ProponoJS {
  constructor(config) {
    this.config = config;
    AWS.config.update(config);
    this.sns = new AWS.SNS();
    this.sqs = new AWS.SQS();

    // processResponse is passed to aws-sdk as a
    // callback. Without the following binds, it's
    // no longer bound to the class when it's executed.
    this.processResponse = this.processResponse.bind(this);
    this.unpackAndProcessMessage = this.unpackAndProcessMessage.bind(this);
    this.poll = this.poll.bind(this);
    this.processComplete = this.processComplete.bind(this);
    this.messageProcessedSuccessfully = this.messageProcessedSuccessfully.bind(this);
  }

  publish(topic, message, cb) {
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

        this.sns.publish(publishParams, (publishErr, publishData) => {
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
    this.processMessage = processMessage;
    this.createTopicQueueAndSubscription(topic, (createErr, queueUrl) => {
      if (createErr) {
        throw createErr;
      } else {
        this.queueUrl = queueUrl;
        this.poll();
      }
    });
  }

  poll() {
    const params = {
      QueueUrl: this.queueUrl,
      // AttributeNames: this.attributeNames,
      // MessageAttributeNames: this.messageAttributeNames,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 10,
      // VisibilityTimeout: this.visibilityTimeout,
    };
    this.sqs.receiveMessage(params, this.processResponse);
  }

  processResponse(err, response) {
    if (response && response.Messages && response.Messages.length > 0) {
      async.each(response.Messages, this.unpackAndProcessMessage, this.processComplete);
    } else if (!err) {
      this.poll();
    }
  }

  unpackAndProcessMessage(message, done) {
    const body = JSON.parse(message.Body);
    const payload = JSON.parse(body.Message);
    // Get rid of these
    this.message = message;
    this.done = done;
    this.processMessage(payload.message, this.messageProcessedSuccessfully);
  }

  messageProcessedSuccessfully() {
    const params = {
      QueueUrl: this.queueUrl,
      ReceiptHandle: this.message.ReceiptHandle,
    };
    // Another function to check for err?
    this.sqs.deleteMessage(params, this.done);
  }

  processComplete(err) {
    if (!err) {
      this.poll();
    }
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

  createSnsTopic(topic, cb) {
    const createParams = {
      Name: topic,
    };
    this.sns.createTopic(createParams, (createErr, createData) => {
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
    const params = { QueueName: this.queueName(topic) };
    this.sqs.createQueue(params, (createErr, createData) => {
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

  getQueueAttributes(queueUrl, cb) {
    const params = {
      QueueUrl: queueUrl,
      AttributeNames: [
        'QueueArn',
      ],
    };
    this.sqs.getQueueAttributes(params, (getErr, getData) => {
      if (getErr) {
        cb(getErr);
      } else {
        // console.log('Get Queue data: ' + JSON.stringify(getData));
        cb(null, getData.Attributes.QueueArn);
      }
    });
  }

  subscribeSqsToSns(topicArn, queueArn, cb) {
    const params = {
      Protocol: 'sqs',
      TopicArn: topicArn,
      Endpoint: queueArn,
    };
    this.sns.subscribe(params, (err) => {
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
    this.sqs.setQueueAttributes(params, (err) => {
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

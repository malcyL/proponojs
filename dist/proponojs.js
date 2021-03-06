(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("aws-sdk"), require("async"), require("shortid"));
	else if(typeof define === 'function' && define.amd)
		define(["aws-sdk", "async", "shortid"], factory);
	else if(typeof exports === 'object')
		exports["proponojs"] = factory(require("aws-sdk"), require("async"), require("shortid"));
	else
		root["proponojs"] = factory(root["aws-sdk"], root["async"], root["shortid"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_2__, __WEBPACK_EXTERNAL_MODULE_3__, __WEBPACK_EXTERNAL_MODULE_4__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	exports.proponojs = __webpack_require__(1);
	exports.env_config = __webpack_require__(6);

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	const AWS = __webpack_require__(2);
	const async = __webpack_require__(3);
	const shortid = __webpack_require__(4);
	const MessageProcessor = __webpack_require__(5);
	
	class ProponoJS {
	  constructor(config) {
	    this.config = config;
	    AWS.config.update(config);
	    this.sns = new AWS.SNS();
	    this.sqs = new AWS.SQS();
	
	    // processResponse is passed to aws-sdk as a
	    // callback. Without the following binds, it's
	    // no longer bound to the class when it's executed.
	    this.poll = this.poll.bind(this);
	    this.processResponse = this.processResponse.bind(this);
	    this.createMessageProcessor = this.createMessageProcessor.bind(this);
	    this.processComplete = this.processComplete.bind(this);
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
	      async.each(response.Messages, this.createMessageProcessor, this.processComplete);
	    } else if (!err) {
	      this.poll();
	    }
	  }
	
	  createMessageProcessor(outerMessage, done) {
	    const processor =
	          new MessageProcessor(this.sqs, this.queueUrl, outerMessage, this.processMessage);
	    processor.process(done);
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


/***/ }),
/* 2 */
/***/ (function(module, exports) {

	module.exports = require("aws-sdk");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

	module.exports = require("async");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

	module.exports = require("shortid");

/***/ }),
/* 5 */
/***/ (function(module, exports) {

	'use strinct';
	
	class MessageProcessor {
	  constructor(sqs, queueUrl, outerMessage, processMessage) {
	    this.sqs = sqs;
	    this.queueUrl = queueUrl;
	    this.outerMessage = outerMessage;
	    this.processMessage = processMessage;
	
	    this.acknowledgeMessage = this.acknowledgeMessage.bind(this);
	    this.processComplete = this.processComplete.bind(this);
	  }
	
	  process(cb) {
	    this.cb = cb;
	    const body = JSON.parse(this.outerMessage.Body);
	    const payload = JSON.parse(body.Message);
	    this.processMessage(payload.message, this.acknowledgeMessage);
	  }
	
	  acknowledgeMessage() {
	    const params = {
	      QueueUrl: this.queueUrl,
	      ReceiptHandle: this.outerMessage.ReceiptHandle,
	    };
	    // Another function to check for err?
	    this.sqs.deleteMessage(params, this.processComplete);
	  }
	
	  processComplete(err) {
	    this.cb(err);
	  }
	}
	
	module.exports = MessageProcessor;


/***/ }),
/* 6 */
/***/ (function(module, exports) {

	const accessKey = process.env.PROPONOJS_AWS_ACCESS_KEY_ID;
	const secretKey = process.env.PROPONOJS_AWS_SECRET_KEY;
	const queueRegion = process.env.PROPONOJS_QUEUE_REGION;
	const applicationName = process.env.PROPONOJS_APPLICATION_NAME;
	const queueSuffix = process.env.PROPONOJS_QUEUE_SUFFIX;
	
	// The following are the complete set of Propono configuration
	// parameters. These are not yet supported by ProponoJS
	//
	// const maxRetries = process.env.PROPONOJS_MAX_RETRIES;
	// const numMessages_per_poll = process.env.PROPONOJS_NUM_MESSAGES_PER_POLL;
	// const useIamProfile = process.env.PROPONOJS.USE_IAM_PROFILE;
	// const applicationName = process.env.PROPONOJS_APPLICATION_NAME;
	// const queueSuffix = process.env.PROPONOJS_QUEUE_SUFFIX;
	
	const config = {
	  accessKeyId: accessKey,
	  secretAccessKey: secretKey,
	  region: queueRegion,
	  applicationName,
	  queueSuffix,
	};
	
	module.exports = config;


/***/ })
/******/ ])
});
;
//# sourceMappingURL=proponojs.js.map
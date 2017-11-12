(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("aws-sdk"), require("sqs-consumer"), require("shortid"));
	else if(typeof define === 'function' && define.amd)
		define(["aws-sdk", "sqs-consumer", "shortid"], factory);
	else if(typeof exports === 'object')
		exports["proponojs"] = factory(require("aws-sdk"), require("sqs-consumer"), require("shortid"));
	else
		root["proponojs"] = factory(root["aws-sdk"], root["sqs-consumer"], root["shortid"]);
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
	exports.env_config = __webpack_require__(5);

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	const AWS = __webpack_require__(2);
	const Consumer = __webpack_require__(3);
	
	const shortid = __webpack_require__(4);
	
	class ProponoJS {
	  constructor(config) {
	    this.config = config;
	    AWS.config.update(config);
	    this.sns = new AWS.SNS();
	    this.sqs = new AWS.SQS();
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
	          sqs: this.sqs,
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

	module.exports = require("sqs-consumer");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

	module.exports = require("shortid");

/***/ }),
/* 5 */
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
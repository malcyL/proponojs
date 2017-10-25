(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("aws-sdk"), require("shortid"));
	else if(typeof define === 'function' && define.amd)
		define(["aws-sdk", "shortid"], factory);
	else if(typeof exports === 'object')
		exports["proponojs"] = factory(require("aws-sdk"), require("shortid"));
	else
		root["proponojs"] = factory(root["aws-sdk"], root["shortid"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_2__, __WEBPACK_EXTERNAL_MODULE_3__) {
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
	exports.env_config = __webpack_require__(4);

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	const AWS = __webpack_require__(2);
	
	const shortid = __webpack_require__(3);
	
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


/***/ }),
/* 2 */
/***/ (function(module, exports) {

	module.exports = require("aws-sdk");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

	module.exports = require("shortid");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

	const accessKey = process.env.PROPONOJS_AWS_ACCESS_KEY_ID;
	const secretKey = process.env.PROPONOJS_AWS_SECRET_KEY;
	const queueRegion = process.env.PROPONOJS_QUEUE_REGION;
	
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
	};
	
	module.exports = config;


/***/ })
/******/ ])
});
;
//# sourceMappingURL=proponojs.js.map
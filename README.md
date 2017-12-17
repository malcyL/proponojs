# ProponoJS
[![Build Status](https://travis-ci.org/malcyL/proponojs.svg?branch=master)](https://travis-ci.org/malcyL/proponojs)
---
[Propono](https://github.com/iHiD/propono) is a pub/sub gem built on top of Amazon Web Services (AWS). It uses Simple Notification Service (SNS) and Simple Queue Service (SQS) to seamlessly pass messages throughout your infrastructure.

ProponoJS is a javascript version of Propono.

ProponoJS is still in development.

### Usage

The first thing to do is configure ProponoJS. You'll be able to do this from
a configuration file in the future, but this early version is using environment
variables. (Early development is being driven by usage in AWS Lambda's which have
no file system and are configured by environment variables.)

Set the following environement variables:

```bash
export PROPONOJS_AWS_ACCESS_KEY_ID=<access-key>
export PROPONOJS_AWS_SECRET_KEY=<secret-key>
export PROPONOJS_QUEUE_REGION=<region e.g. eu-west-1>
```

You can then start publishing messages easily from anywhere in your code base:

```javascript
const proponojsConfig = require('proponojs').env_config;
const proponojs = require('proponojs').proponojs(proponojsConfig);

const message = {'event': 'created', 'userId': 1 };
proponojs.publish(
  'user', 
  message, 
  (err, data) => {
    cb(err);
  }
);
```

Listening for messages is easy too. Just tell Propono what your application is called and start listening. 

```bash
export PROPONOJS_AWS_ACCESS_KEY_ID=<access-key>
export PROPONOJS_AWS_SECRET_KEY=<secret-key>
export PROPONOJS_QUEUE_REGION=<region e.g. eu-west-1>
export PROPONOJS_APPLICATION_NAME=<listening application name e.g. proponojs-test>
```

```javascript
const proponojsConfig = require('proponojs').env_config;
const proponojs = require('proponojs').proponojs(proponojsConfig);

proponojs.listen('user',(message, done) => {
  console.log('Message received:');
  console.log('message: ' + JSON.stringify(message));
  done();
});
```
### Build with webpack
Run:
```bash
$ npm run build
```
creates source file and also creates both minified and non-minified version

## Testing
Run:
```bash
$ npm run test
```

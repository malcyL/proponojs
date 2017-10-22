import chai from "chai";

var AWS = require('aws-sdk-mock');

// Import the proponojs class instance.
import proponojs from "../src/App.es6";

chai.should();

describe('#ProponoJS Library Test', function () {

  describe('#ProponoJS', function () {
    it('should be an object', function () {
      proponojs({}).should.be.an('object');
    });
  });

  describe('#Publish', function () {
    it('should create topic and publish message', function () {
      AWS.mock('SNS', 'createTopic', {'TopicArn':'testArn'});
      AWS.mock('SNS', 'publish', {'MessageId':'testMessage'});

      proponojs({}).publish('test-topic', 'test-message', function(err, data) {
        data.MessageId.should.eq('testMessage');
      });

      AWS.restore();
    });
  });

});

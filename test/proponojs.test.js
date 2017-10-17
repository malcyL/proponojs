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
    it('should return topic name', function () {
      AWS.mock('SNS', 'createTopic', 'test-topic-arn');

      proponojs({}).publish('test-topic', 'test-message', function(err, topic) {
        topic.should.eq('test-topic-arn');
      });

      AWS.restore();
    });
  });

});

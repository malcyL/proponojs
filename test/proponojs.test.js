import chai from "chai";

// Import the proponojs class instance.
import proponojs from "../src/App.es6";

chai.should();

describe('#ProponoJS Library Test', function () {

  describe('#ProponoJS', function () {
    it('should be an object', function () {
      proponojs('config').should.be.an('object');
    });
  });

  describe('#Publish', function () {
    it('should return topic name', function () {
      proponojs('config').publish('test-topic', 'test-message').should.eq('test-topic');
    });
  });

});

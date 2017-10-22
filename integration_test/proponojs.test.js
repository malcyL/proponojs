import chai from "chai";

// Import the proponojs class instance.
import proponojs from "../src/App.es6";

import config from "../src/config/env_config.js";

chai.should();

describe('#ProponoJS Library Integration Test', function () {

  describe('#ProponoJS', function () {
    it('should create a ProponoJS class from config', function () {
      proponojs(config);
    });

    it('should create an SNS topic when message is published', function () {
      console.log(config);
      const propono = proponojs(config);
      propono.publish('proponojsTest', 'Test Message', function(err, data) {
        (err === null).should.be.true();
        (data === null).should.be.false();
      });
    });
  });

});

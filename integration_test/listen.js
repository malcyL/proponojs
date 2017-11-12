const config = require('../src/config/env_config.js');
const proponojs = require('../src/proponojs.js')(config);

proponojs.listen('ml-test-topic',(message, done) => {
  console.log('Message received...');
  console.log('message: ' + JSON.stringify(message));
  done();
});

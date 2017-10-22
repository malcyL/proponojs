const config = require('../src/config/env_config.js');
const proponojs = require('../src/proponojs.js')(config);

proponojs.publish('ml-test-topic', 'Hello, ProponoJS', (err, data) => {
  console.log('Publish completed...');
  console.log('Error: ' + err);
  console.log('Data: ' + data);
});

const config = require('../src/config/env_config.js');
const proponojs = require('../src/proponojs.js')(config);

const message = {file: 'stuff.txt'};
proponojs.publish('ml-test-topic', message, (err, data) => {
  console.log('Publish completed...');
  console.log('Error: ' + err);
  console.log('Data: ' + data);
});

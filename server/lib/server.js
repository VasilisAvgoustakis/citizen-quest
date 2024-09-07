const logger = require('winston');
const initApp = require('./app');

function createServer(port, config) {
  const [app, wss] = initApp(config);
  const server = app.listen(port);

  server.on('upgrade', (request, socket, head) => {
    logger.info('Upgrading connection to WebSocket');
    wss.handleUpgrade(request, socket, head, (socket2) => {
      wss.emit('connection', socket2, request);
    });
  });

  return server;
}

module.exports = createServer;

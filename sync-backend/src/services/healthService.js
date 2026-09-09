const logger = require('../utilities/logger')
const net = require('net');

function pingPort(host, port, timeout = 2000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

const getHealth = async (port, host) => {
    try {
        const getHealth = await pingPort(host, port);
        if (!getHealth) {
            return { message: 'Port is not working', data: getHealth };
        }
         return { message: 'Port is working', data: getHealth };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    getHealth
}
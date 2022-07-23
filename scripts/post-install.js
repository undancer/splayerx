// const fs = require('fs');
// const path = require('path');
const { exec } = require('child_process');

// require('events').EventEmitter.prototype._maxListeners = 10000;

const commands = [
  'patch-package',
  'node scripts/gen-electron-builder-config.js',
  // 'npm run lint:fix',
  'npm run lint',
  'npm run install-app-deps',
];

exec(commands.join(' && '), (error, stdout) => {
  // if (error) throw error;
  // eslint-disable-next-line no-console
  console.log(error, stdout);
});

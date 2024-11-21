const { spawn } = require('child_process');
const cp = require('child_process');
const chalk = require('chalk');
const { promisify } = require('util');
const exec = promisify(cp.exec).bind(cp);

function start(cmd) {
    return spawn(cmd, [], {
            stdio: ['inherit', 'inherit', 'inherit', 'ipc']
                });
                }
// Clear the terminal
start('clear');

// Display colored text using chalk
console.log(chalk.blue('CREATED')+chalk.red(' BY')+chalk.blue(' @hwuwhw99'));

// Start bash
start('bash');

console.log(chalk.green('Terminal ready to use!'));
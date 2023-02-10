#!/usr/bin/env nodejs

const signin = require('./signin');
const cleanup = require('./cleanup');
const unbuild = require('./unbuild');

const [a,b,cmd,...args] = process.argv;

switch (cmd) {
    case 'signin': signin();
    break;
    case 'cleanup': cleanup(...args);
    break;
    case 'unbuild': unbuild();
    break;
    default: throw new Error(`Command ${cmd} is not a valid command`)
}
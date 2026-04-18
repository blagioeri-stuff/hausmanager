#!/usr/bin/env node
import { scrypt, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "<dein-passwort>"');
  process.exit(1);
}

const salt = randomBytes(16);
const key = await scryptAsync(password, salt, 64);
const hash = `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
const sessionSecret = randomBytes(32).toString('hex');

console.log('# Folgende Zeilen in deine .env (auf dem NAS) eintragen:');
console.log('');
console.log(`APP_PASSWORD_HASH='${hash}'`);
console.log(`SESSION_SECRET='${sessionSecret}'`);
console.log('SESSION_MAX_AGE=2592000');

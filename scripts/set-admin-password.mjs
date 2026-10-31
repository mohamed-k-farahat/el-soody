// Sets the admin panel password. The password is typed here (hidden) and only its PBKDF2 hash is stored.
// Usage:  node scripts/set-admin-password.mjs            (live site)
//         node scripts/set-admin-password.mjs --local    (this computer's test database)
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ITERATIONS = 100000; // must match src/lib/auth.js
const target = process.argv.includes('--local') ? '--local' : '--remote';
const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function ask(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    let value = '';
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (ch) => {
      if (ch === '\r' || ch === '\n' || ch === '\u0004') {
        stdin.setRawMode?.(false);
        stdin.pause();
        stdin.off('data', onData);
        process.stdout.write('\n');
        resolve(value);
      } else if (ch === '\u0003') {
        process.stdout.write('\n');
        process.exit(1);
      } else if (ch === '\u007f' || ch === '\b') {
        value = value.slice(0, -1);
      } else {
        value += ch;
        process.stdout.write('*');
      }
    };
    stdin.on('data', onData);
  });
}

const password = await ask('New admin password (at least 10 characters): ');
if (password.length < 10) { console.log('Too short. Nothing was changed.'); process.exit(1); }
if ((await ask('Type it again: ')) !== password) { console.log('They do not match. Nothing was changed.'); process.exit(1); }

const salt = randomBytes(16);
const hash = `pbkdf2$${ITERATIONS}$${b64url(salt)}$${b64url(pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256'))}`;
const sql = `INSERT INTO settings (key, value) VALUES ('admin_password_hash', '${hash}') ON CONFLICT(key) DO UPDATE SET value = excluded.value;`;

console.log(`Saving to the ${target === '--remote' ? 'live' : 'local'} database...`);
execFileSync('npx', ['wrangler', 'd1', 'execute', 'el-soody-db', target, '--command', sql], { stdio: ['ignore', 'ignore', 'inherit'], shell: true });
console.log('Done. The admin password is set. Every device that was logged in must log in again.');

// Sets the admin panel password. The password is typed here (hidden) and only its PBKDF2 hash is stored.
// Usage:  node scripts/set-admin-password.mjs            (live site)
//         node scripts/set-admin-password.mjs --local    (this computer's test database)
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const ITERATIONS = 100000; // must match src/lib/auth.js
const target = process.argv.includes('--local') ? '--local' : '--remote';
const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// input that arrived after an Enter (e.g. pasted text) is kept for the next prompt
let pending = '';

/** reads one hidden line; handles typed and pasted input */
function ask(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    let value = '';
    let finished = false;
    const done = () => {
      finished = true;
      stdin.setRawMode?.(false);
      stdin.pause();
      stdin.off('data', onData);
      process.stdout.write('\n');
      resolve(value);
    };
    const feed = (text) => {
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '\r' || ch === '\n' || ch === '\u0004') {
          pending = text.slice(ch === '\r' && text[i + 1] === '\n' ? i + 2 : i + 1);
          return done();
        }
        if (ch === '\u0003') { process.stdout.write('\n'); process.exit(1); }
        if (ch === '\u007f' || ch === '\b') { if (value) { value = value.slice(0, -1); process.stdout.write('\b \b'); } continue; }
        if (ch >= ' ') { value += ch; process.stdout.write('*'); }
      }
    };
    const onData = (chunk) => feed(chunk);
    const left = pending;
    pending = '';
    feed(left);
    if (finished) return;
    stdin.setRawMode?.(true);
    stdin.setEncoding('utf8');
    stdin.on('data', onData);
    stdin.resume();
  });
}

const password = await ask('New admin password (at least 10 characters): ');
if (password.length < 10) { console.log('Too short. Nothing was changed.'); process.exit(1); }
if ((await ask('Type it again: ')) !== password) { console.log('They do not match. Nothing was changed.'); process.exit(1); }

const salt = randomBytes(16);
const hash = `pbkdf2$${ITERATIONS}$${b64url(salt)}$${b64url(pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256'))}`;
const sql = `INSERT INTO settings (key, value) VALUES ('admin_password_hash', '${hash}') ON CONFLICT(key) DO UPDATE SET value = excluded.value;`;

// run wrangler's own script with node directly (no shell), so Windows can't split the SQL apart
const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const wrangler = join(site, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

console.log(`Saving to the ${target === '--remote' ? 'live' : 'local'} database...`);
try {
  execFileSync(process.execPath, [wrangler, 'd1', 'execute', 'el-soody-db', target, '--command', sql], { cwd: site, stdio: ['ignore', 'ignore', 'pipe'] });
  console.log('Done. The admin password is set. Every device that was logged in must log in again.');
} catch (e) {
  // show wrangler's error lines (they never contain the password)
  const reason = String(e.stderr || '').replace(/\x1b\[[0-9;]*m/g, '').split('\n').filter((l) => /error/i.test(l)).slice(-2).join(' ');
  console.log(`Could not save the password. Nothing was changed.${reason ? `\n${reason}` : ''}`);
  process.exitCode = 1;
}

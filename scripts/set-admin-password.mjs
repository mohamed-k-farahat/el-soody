// Sets the admin panel password. The password is typed here (hidden) and only its PBKDF2 hash is kept.
// Usage:  node scripts/set-admin-password.mjs           writes scripts/.admin-password.sql (hash only) for the live site;
//                                                        apply it with: npx wrangler d1 execute el-soody-db --remote --file=scripts/.admin-password.sql
//         node scripts/set-admin-password.mjs --local   saves straight into this computer's test database
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const ITERATIONS = 100000; // must match src/lib/auth.js
const local = process.argv.includes('--local');
const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const CR = String.fromCharCode(13);
const LF = String.fromCharCode(10);
const CTRL_C = String.fromCharCode(3);
const CTRL_D = String.fromCharCode(4);
const BACKSPACES = [String.fromCharCode(8), String.fromCharCode(127)];

// input that arrived after an Enter (e.g. pasted text) is kept for the next prompt
let pending = '';
// Windows terminals can send Enter as CR and then LF separately; that stray LF must not end the next prompt
let lastWasCR = false;

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
        if (ch === LF && lastWasCR) { lastWasCR = false; continue; }
        lastWasCR = ch === CR;
        if (ch === CR || ch === LF || ch === CTRL_D) {
          pending = text.slice(i + 1);
          return done();
        }
        if (ch === CTRL_C) { process.stdout.write('\n'); process.exit(1); }
        if (BACKSPACES.includes(ch)) {
          if (value) { value = value.slice(0, -1); process.stdout.write('\b \b'); }
          continue;
        }
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

if (!local) {
  // wrangler will not use the browser login from inside this script, so leave the hashed value in a file
  // (it holds only the hash, never the password) to apply from a normal wrangler session
  writeFileSync(join(site, 'scripts', '.admin-password.sql'), `${sql}\n`);
  console.log('Ready. The hashed password is in scripts/.admin-password.sql (the password itself is not in it).');
  console.log('Tell Claude "ready" to apply it to the live site; the file is deleted after.');
  process.exit(0);
}

// local test database: run wrangler's own script with node directly (no shell), so Windows can't split the SQL
const wrangler = join(site, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
console.log('Saving to the local database...');
try {
  execFileSync(process.execPath, [wrangler, 'd1', 'execute', 'el-soody-db', '--local', '--command', sql], { cwd: site, stdio: ['ignore', 'ignore', 'pipe'] });
  console.log('Done. The local admin password is set.');
} catch (e) {
  const reason = String(e.stderr || '').split(LF).filter((l) => /error/i.test(l)).slice(-2).join(' ');
  console.log(`Could not save the password. Nothing was changed.${reason ? `\n${reason}` : ''}`);
  process.exitCode = 1;
}

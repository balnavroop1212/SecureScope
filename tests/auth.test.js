const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert');

// Import compiled backend modules from dist-electron
const { PasswordHasher } = require('../dist-electron/main/services/auth/PasswordHasher');
const { LocalAuthRepository } = require('../dist-electron/main/services/auth/LocalAuthRepository');

async function runAuthTests() {
  console.log('====================================================');
  console.log('SecureScope — Milestone 3 Authentication Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• Testing: ${name}... `);
      await fn();
      console.log('PASSED ✅');
      passed++;
    } catch (err) {
      console.log('FAILED ❌');
      console.error('  Error:', err.message);
      failed++;
    }
  }

  // TEST 1: Password Hashing & Verification
  await test('PasswordHasher generates valid Scrypt hash and verifies correctly', async () => {
    const password = 'SuperSecretP@ssword123!';
    const hash = await PasswordHasher.hashPassword(password);

    assert(hash.startsWith('$scrypt$'), 'Hash format must start with $scrypt$');
    assert(hash.includes('N=16384'), 'Hash must contain cost parameter N=16384');

    const isMatch = await PasswordHasher.verifyPassword(password, hash);
    assert.strictEqual(isMatch, true, 'Correct password must verify to true');

    const isWrongMatch = await PasswordHasher.verifyPassword('WrongP@ssword123!', hash);
    assert.strictEqual(isWrongMatch, false, 'Wrong password must verify to false');
  });

  // Setup isolated temporary data directory for repo testing
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'securescope-auth-test-'));
  const authRepo = new LocalAuthRepository(tempDir);

  // TEST 2: Schema Initialization
  await test('LocalAuthRepository initializes users.json with valid schema', async () => {
    await authRepo.initialize();
    const usersFile = path.join(tempDir, 'users.json');
    assert(fs.existsSync(usersFile), 'users.json file must exist');

    const content = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    assert.strictEqual(content.schemaVersion, 1, 'schemaVersion must be 1');
    assert(Array.isArray(content.users), 'users must be an array');
    assert.strictEqual(content.users.length, 0, 'initial users array must be empty');
  });

  // TEST 3: User Registration
  await test('User registration succeeds and never stores plaintext password', async () => {
    const result = await authRepo.register({
      firstName: 'Alex',
      lastName: 'Vance',
      email: 'alex.vance@example.com',
      password: 'StrongPassword123!',
    });

    assert.strictEqual(result.success, true, 'Registration must succeed');
    assert(result.user, 'Result must contain user object');
    assert(result.user.id.startsWith('usr_'), 'User ID must be prefixed with usr_');
    assert.strictEqual(result.user.email, 'alex.vance@example.com', 'Email must match');
    assert.strictEqual(result.user.plan, 'free', 'Default plan must be free');
    assert.strictEqual(result.user.passwordHash, undefined, 'Sanitized user must not have passwordHash');

    // Inspect disk representation
    const usersFile = path.join(tempDir, 'users.json');
    const content = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    assert.strictEqual(content.users.length, 1, 'File must contain 1 user');
    assert.notStrictEqual(content.users[0].passwordHash, 'StrongPassword123!', 'Must NOT be plaintext');
    assert(content.users[0].passwordHash.startsWith('$scrypt$'), 'Must be scrypt hashed');
  });

  // TEST 4: Duplicate Email Rejection
  await test('Registration rejects duplicate email (case-insensitive)', async () => {
    const result = await authRepo.register({
      firstName: 'Duplicate',
      lastName: 'User',
      email: 'ALEX.VANCE@EXAMPLE.COM', // Uppercase variation
      password: 'StrongPassword123!',
    });

    assert.strictEqual(result.success, false, 'Duplicate email registration must fail');
    assert(result.error.includes('already exists'), 'Error message must state account already exists');
  });

  // TEST 5: Password Complexity Enforcement
  await test('Registration rejects weak passwords lacking complexity', async () => {
    const weakShort = await authRepo.register({
      firstName: 'Weak',
      lastName: 'Test',
      email: 'weak1@example.com',
      password: 'short',
    });
    assert.strictEqual(weakShort.success, false, 'Short password must fail');

    const noUpper = await authRepo.register({
      firstName: 'Weak',
      lastName: 'Test',
      email: 'weak2@example.com',
      password: 'lowercaseonly123!',
    });
    assert.strictEqual(noUpper.success, false, 'Password without uppercase must fail');

    const noSymbol = await authRepo.register({
      firstName: 'Weak',
      lastName: 'Test',
      email: 'weak3@example.com',
      password: 'Password123456',
    });
    assert.strictEqual(noSymbol.success, false, 'Password without symbol must fail');
  });

  // TEST 6: Successful Login
  await test('Login succeeds with correct credentials and creates session', async () => {
    const result = await authRepo.login({
      email: 'alex.vance@example.com',
      password: 'StrongPassword123!',
      rememberMe: true,
    });

    assert.strictEqual(result.success, true, 'Login must succeed');
    assert(result.user, 'Result must contain user');
    assert.strictEqual(result.user.firstName, 'Alex', 'User name must match');

    // Verify session
    const session = await authRepo.getCurrentSession();
    assert(session, 'Active session must exist');
    assert.strictEqual(session.userId, result.user.id, 'Session userId must match');
    assert.strictEqual(session.rememberMe, true, 'rememberMe must be true');

    // Verify getCurrentUser()
    const currentUser = await authRepo.getCurrentUser();
    assert(currentUser, 'getCurrentUser() must return user');
    assert.strictEqual(currentUser.id, result.user.id, 'User ID must match session');
  });

  // TEST 7: Invalid Credential Login Rejection
  await test('Login rejects incorrect password and nonexistent email', async () => {
    const wrongPass = await authRepo.login({
      email: 'alex.vance@example.com',
      password: 'WrongPassword999!',
    });
    assert.strictEqual(wrongPass.success, false, 'Wrong password must be rejected');
    assert.strictEqual(wrongPass.error, 'Invalid email or password');

    const nonExistent = await authRepo.login({
      email: 'ghost@example.com',
      password: 'StrongPassword123!',
    });
    assert.strictEqual(nonExistent.success, false, 'Non-existent email must be rejected');
    assert.strictEqual(nonExistent.error, 'Invalid email or password');
  });

  // TEST 8: Profile Update Persistence
  await test('User profile updates persist atomically', async () => {
    const currentUser = await authRepo.getCurrentUser();
    assert(currentUser, 'Must have current user');

    const updated = await authRepo.updateProfile(currentUser.id, {
      firstName: 'Alexander',
      lastName: 'Vance-Prime',
    });

    assert.strictEqual(updated.firstName, 'Alexander', 'First name must be updated');
    assert.strictEqual(updated.lastName, 'Vance-Prime', 'Last name must be updated');

    // Verify re-reading from disk
    const reloaded = await authRepo.getUserById(currentUser.id);
    assert.strictEqual(reloaded.firstName, 'Alexander', 'Persisted first name must match');
  });

  // TEST 9: Logout & Session Clearance
  await test('Logout clears active session and resets state', async () => {
    await authRepo.clearSession();
    const session = await authRepo.getCurrentSession();
    assert.strictEqual(session, null, 'Session must be null after logout');

    const currentUser = await authRepo.getCurrentUser();
    assert.strictEqual(currentUser, null, 'Current user must be null after logout');
  });

  // Cleanup temp files
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {}

  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAuthTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});


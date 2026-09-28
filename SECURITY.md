# Privacy design

## Intended protection

Selected diary entries remain unreadable to someone browsing the local database or using the app while its vault is locked. This is selective encryption: ordinary entries and their backups are not confidential. The application is not a defense against malware, administrator access to process memory, screen capture, or someone reading an already unlocked entry.

## Encryption

- A random 256-bit vault key encrypts private entry payloads with XChaCha20-Poly1305 (RustCrypto). Every save generates a fresh 192-bit random nonce. The entry ID is authenticated as associated data.
- Payloads contain both title and body, including all Pile messages and the unsent draft.
- Argon2id v1.3 derives a key from the password and a random 128-bit salt, with fixed v1 parameters: 19 MiB memory, 2 iterations, 1 lane, 32-byte output. That derived key wraps the vault key using a separate authenticated context.
- Nonces, salt, wrapped key, ciphertext and visible entry metadata are persisted. Passwords and raw keys are not persisted. Rust key material and password buffers use zeroize; JavaScript/OS memory cannot be guaranteed erased.
- Password change rewraps the same vault key. It does not revoke copies of an already exposed vault key, and old backups continue to use their old password.

## Session boundary

Encryption/decryption and authorization are enforced in Rust commands. Locked content cannot be read, saved, exported, made ordinary, trashed, or permanently deleted through those commands. The UI redacts private titles and text and searches only content currently available to the backend. Search does not create an on-disk plaintext index.

On blur, the UI immediately conceals content, flushes its ordered save queue, and locks the backend. A native focus-loss watchdog locks after two seconds even if the webview does not respond. Backend inactivity and resume-gap checks operate independently of webview timers. Lock/unlock generations prevent a stale focus-loss watchdog from locking a newly authenticated session.

Successfully saved private content is removed from UI state on lock. If saving fails, an unsaved draft remains only in the in-memory save queue, concealed until the user unlocks and retries. This favors recovery without writing a plaintext recovery file. A forced exit can lose that unsaved draft. Private editors disable spellcheck and autocorrection, but OS-level input tools and clipboard history are outside the app's control.

## Storage, migration and backups

SQLite uses synchronous FULL, DELETE journal mode, and secure_delete. Converting an ordinary entry to private replaces its payload and vacuums the database. Legacy text files are removed only after migration commits. The native data directory uses owner-only permissions on Unix.

This does not securely erase SSD blocks, filesystem snapshots, external exports or old backups. Existing plaintext copies cannot be retroactively protected. Markdown export deliberately produces a readable copy after an explicit confirmation.

Backups preserve encrypted private payloads and the wrapped vault key. Their surrounding metadata and ordinary entries are readable. Restore validates structural metadata and runs transactionally; authentication of encrypted entries occurs when they are unlocked/read. A corrupted ciphertext fails closed.

The content security policy permits bundled assets and Tauri IPC, with no remote content or network API. User writing is rendered as text, never injected as HTML.

## Verification

Automated Rust tests cover authenticated encryption, wrong passwords, ciphertext tampering and entry substitution, password changes, private-command authorization, locked search, trash restrictions, ciphertext-preserving backup restoration, rollback on malformed restores, legacy Pile migration and rollback on a missing legacy file. Frontend queue tests cover overlapping edits and retryable write failures.

This implementation has not undergone an external cryptographic audit. Native file dialogs and OS-specific sleep/screen-lock delivery require platform acceptance testing; browser interaction checks use a mocked desktop bridge, not a running native window.

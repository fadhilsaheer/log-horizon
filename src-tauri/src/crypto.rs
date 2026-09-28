use argon2::{Algorithm, Argon2, Params, Version};
use chacha20poly1305::{
    aead::{Aead, KeyInit, Payload},
    XChaCha20Poly1305, XNonce,
};
use rand_core::{OsRng, RngCore};
use zeroize::Zeroizing;

pub type Key = Zeroizing<[u8; 32]>;
pub fn random_key() -> Key {
    let mut k = Zeroizing::new([0; 32]);
    OsRng.fill_bytes(&mut *k);
    k
}
pub fn salt() -> [u8; 16] {
    let mut s = [0; 16];
    OsRng.fill_bytes(&mut s);
    s
}
pub fn derive(password: &str, salt: &[u8]) -> Result<Key, String> {
    let mut key = Zeroizing::new([0; 32]);
    Argon2::new(
        Algorithm::Argon2id,
        Version::V0x13,
        Params::new(19 * 1024, 2, 1, Some(32)).map_err(|_| "Invalid key derivation parameters")?,
    )
    .hash_password_into(password.as_bytes(), salt, &mut *key)
    .map_err(|_| "Could not derive password key")?;
    Ok(key)
}
pub fn encrypt(key: &[u8; 32], data: &[u8], context: &[u8]) -> Result<Vec<u8>, String> {
    let mut nonce = [0; 24];
    OsRng.fill_bytes(&mut nonce);
    let cipher = XChaCha20Poly1305::new(key.into());
    let mut output = nonce.to_vec();
    output.extend(
        cipher
            .encrypt(
                XNonce::from_slice(&nonce),
                Payload {
                    msg: data,
                    aad: context,
                },
            )
            .map_err(|_| "Could not encrypt entry")?,
    );
    Ok(output)
}
pub fn decrypt(key: &[u8; 32], data: &[u8], context: &[u8]) -> Result<Zeroizing<Vec<u8>>, String> {
    if data.len() < 40 {
        return Err("Encrypted data is incomplete".into());
    }
    XChaCha20Poly1305::new(key.into())
        .decrypt(
            XNonce::from_slice(&data[..24]),
            Payload {
                msg: &data[24..],
                aad: context,
            },
        )
        .map(Zeroizing::new)
        .map_err(|_| "Password is incorrect or encrypted data is damaged".into())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn authenticated_encryption() {
        let key = random_key();
        let a = encrypt(&key, b"private thought", b"entry-1").unwrap();
        let b = encrypt(&key, b"private thought", b"entry-1").unwrap();
        assert_ne!(a, b);
        assert_eq!(
            &**decrypt(&key, &a, b"entry-1").unwrap(),
            b"private thought"
        );
        assert!(decrypt(&key, &a, b"entry-2").is_err());
        assert!(decrypt(&random_key(), &a, b"entry-1").is_err());
        let mut changed = a;
        changed[25] ^= 1;
        assert!(decrypt(&key, &changed, b"entry-1").is_err());
    }
}

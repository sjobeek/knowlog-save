import { base32, base64 } from "rfc4648";
import {
  bufferToArrayBuffer,
  arrayBufferToBuffer,
  hexStringToTypedArray,
  arrayBufferToHex,
} from "./misc";

const DEFAULT_ITER = 10000;

const getKeyIVFromPassword = async (
  salt: Uint8Array,
  password: string,
  rounds: number = DEFAULT_ITER
) => {
  const k1 = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey", "deriveBits"]
  );

  const k2 = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: rounds,
      hash: "SHA-256",
    },
    k1,
    256 + 128
  );

  return k2;
};

export const encryptArrayBuffer = async (
  arrBuf: ArrayBuffer,
  password: string,
  rounds: number = DEFAULT_ITER,
  saltHex: string = ""
) => {
  let salt: Uint8Array;
  if (saltHex !== "") {
    salt = hexStringToTypedArray(saltHex);
  } else {
    salt = window.crypto.getRandomValues(new Uint8Array(8));
  }

  const derivedKey = await getKeyIVFromPassword(salt, password, rounds);
  const key = derivedKey.slice(0, 32);
  const iv = derivedKey.slice(32, 32 + 16);

  const keyCrypt = await window.crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-CBC" },
    false,
    ["encrypt", "decrypt"]
  );

  const enc = (await window.crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    keyCrypt,
    arrBuf
  )) as ArrayBuffer;

  const prefix = new TextEncoder().encode("Salted__");

  const res = new Uint8Array([...prefix, ...salt, ...new Uint8Array(enc)]);

  return bufferToArrayBuffer(res);
};

export const decryptArrayBuffer = async (
  arrBuf: ArrayBuffer,
  password: string,
  rounds: number = DEFAULT_ITER
) => {
  const prefix = arrBuf.slice(0, 8);
  const salt = arrBuf.slice(8, 16);
  const derivedKey = await getKeyIVFromPassword(
    new Uint8Array(salt),
    password,
    rounds
  );
  const key = derivedKey.slice(0, 32);
  const iv = derivedKey.slice(32, 32 + 16);

  const keyCrypt = await window.crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-CBC" },
    false,
    ["encrypt", "decrypt"]
  );

  const dec = (await window.crypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    keyCrypt,
    arrBuf.slice(16)
  )) as ArrayBuffer;

  return dec;
};

export const encryptStringToBase32 = async (
  text: string,
  password: string,
  rounds: number = DEFAULT_ITER,
  saltHex: string = ""
) => {
  const enc = await encryptArrayBuffer(
    bufferToArrayBuffer(new TextEncoder().encode(text)),
    password,
    rounds,
    saltHex
  );
  return base32.stringify(new Uint8Array(enc));
};

export const decryptBase32ToString = async (
  text: string,
  password: string,
  rounds: number = DEFAULT_ITER
) => {
  return new TextDecoder().decode(
    await decryptArrayBuffer(
      bufferToArrayBuffer(base32.parse(text)),
      password,
      rounds
    )
  );
};

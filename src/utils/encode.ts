import { env } from 'node:process'
// eslint-disable-next-line e18e/ban-dependencies
import CryptoJS from 'crypto-js'

const SECRET_KEY = env.NEXT_PUBLIC_CLIENT_SECRET || 'default_secret'

export function encodeId(id: string | number): string {
  return CryptoJS.AES.encrypt(id.toString(), SECRET_KEY).toString()
}

export function decodeId(cipher: string): string {
  const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

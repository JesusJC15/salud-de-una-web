import { env } from 'node:process'

import CryptoJS from 'crypto-js'

const ID_ENCRYPTION_KEY = env.NEXT_PUBLIC_ID_ENCRYPTION_KEY || 'default_id_key'

export function encodeId(id: string | number): string {
  return CryptoJS.AES.encrypt(id.toString(), ID_ENCRYPTION_KEY).toString()
}

export function decodeId(cipher: string): string {
  const bytes = CryptoJS.AES.decrypt(cipher, ID_ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function trimTrailingSlashes(url: string): string {
  let end = url.length
  while (end > 0 && url[end - 1] === '/') end--
  return end === url.length ? url : url.slice(0, end)
}

export function trimLeadingSlashes(str: string): string {
  let start = 0
  while (start < str.length && str[start] === '/') start++
  return start === 0 ? str : str.slice(start)
}

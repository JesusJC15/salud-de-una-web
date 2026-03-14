import type { Transition, Variants } from 'motion/react'

const smoothEase: [number, number, number, number] = [
  0.22,
  1,
  0.36,
  1,
]

export const pageReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: smoothEase,
    },
  },
}

export const staggerParent: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: smoothEase,
    },
  },
}

export const cardPopIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.34,
      ease: smoothEase,
    },
  },
}

export const floatingTransition: Transition = {
  duration: 4,
  repeat: Infinity,
  repeatType: 'mirror',
  ease: 'easeInOut',
}

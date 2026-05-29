"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function ForgotPasswordPage() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='bg-white p-8 rounded-lg shadow-md w-full max-w-md'
      >
        <h1 className='text-2xl font-bold text-center mb-4' style={{ color: 'var(--ih-text-primary)' }}>
          ¿Olvidaste tu contraseña?
        </h1>
        <p className='text-center text-gray-600 mb-6'>
          Por favor, ponte en contacto con el administrador para restablecer tu contraseña.
        </p>
        <div className='flex justify-center'>
          <Link
            href='/login'
            className='text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded px-4 py-2 transition'
          >
            Volver al login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

import React from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  }[type]

  return (
    <div className={`${bgColor} text-white px-4 py-2 rounded-md shadow-lg flex items-center justify-between`}>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200"
      >
        ✕
      </button>
    </div>
  )
}

interface ToasterProps {
  toasts?: Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }>
  onRemoveToast?: (id: string) => void
}

export const Toaster: React.FC<ToasterProps> = ({ toasts = [], onRemoveToast }) => {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemoveToast?.(toast.id)}
        />
      ))}
    </div>
  )
}

export default Toaster

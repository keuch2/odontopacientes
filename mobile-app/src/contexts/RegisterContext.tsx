import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface RegisterData {
  // Step 1
  fullName: string
  email: string
  phone: string
  birthDate: string
  course: string
  faculty: string
  password: string
  confirmPassword: string
  // Step 2
  profileImage: string | null
  profileImageBase64: string | null
}

interface RegisterContextType {
  registerData: RegisterData
  updateRegisterData: (data: Partial<RegisterData>) => void
  resetRegisterData: () => void
}

const initialData: RegisterData = {
  fullName: '',
  email: '',
  phone: '',
  birthDate: '',
  course: '',
  faculty: '',
  password: '',
  confirmPassword: '',
  profileImage: null,
  profileImageBase64: null,
}

const RegisterContext = createContext<RegisterContextType | undefined>(undefined)

export const RegisterProvider = ({ children }: { children: ReactNode }) => {
  const [registerData, setRegisterData] = useState<RegisterData>(initialData)

  const updateRegisterData = (data: Partial<RegisterData>) => {
    setRegisterData(prev => ({ ...prev, ...data }))
  }

  const resetRegisterData = () => {
    setRegisterData(initialData)
  }

  return (
    <RegisterContext.Provider value={{ registerData, updateRegisterData, resetRegisterData }}>
      {children}
    </RegisterContext.Provider>
  )
}

export const useRegister = () => {
  const context = useContext(RegisterContext)
  if (!context) {
    throw new Error('useRegister must be used within RegisterProvider')
  }
  return context
}

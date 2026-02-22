import React, { Component, ErrorInfo, useEffect, useState } from 'react'
import { Platform, ScrollView, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PaperProvider, MD3LightTheme } from 'react-native-paper'
import * as SplashScreen from 'expo-splash-screen'
import * as Font from 'expo-font'
import { Ionicons } from '@expo/vector-icons'

import Navigation from './src/navigation'
import { useAuthStore } from './src/store/auth'
import { RegisterProvider } from './src/contexts/RegisterContext'
import LoadingScreen from './src/components/LoadingScreen'
import LoginScreen from './src/screens/LoginScreen'
import WelcomeScreen from './src/screens/WelcomeScreen'
import RegisterStep1Screen from './src/screens/RegisterStep1Screen'
import RegisterStep2Screen from './src/screens/RegisterStep2Screen'
import RegisterStep3Screen from './src/screens/RegisterStep3Screen'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'

// Crear cliente de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
})

// Tema personalizado
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3b82f6',
    primaryContainer: '#dbeafe',
    secondary: '#6366f1',
    secondaryContainer: '#e0e7ff',
    surface: '#ffffff',
    surfaceVariant: '#f1f5f9',
    background: '#f8fafc',
    error: '#ef4444',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onSurface: '#0f172a',
    onBackground: '#0f172a',
    outline: '#cbd5e1',
  },
}

// Mantener la pantalla de splash visible solo en plataformas nativas
// TEMPORAL: Comentado para diagnosticar error de C++ exception
// if (Platform.OS !== 'web') {
//   SplashScreen.preventAutoHideAsync()
// }

const AuthStack = createNativeStackNavigator()

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string; componentStack: string }
> {
  state = { hasError: false, errorMessage: '', componentStack: '' }

  private webErrorHandler?: (event: any) => void
  private webRejectionHandler?: (event: any) => void

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidMount() {
    if (Platform.OS !== 'web') {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    this.webErrorHandler = (event: any) => {
      const error = event?.error
      const errorMessage = error instanceof Error ? error.message : String(event?.message ?? error ?? 'Error')
      const componentStack = error instanceof Error ? error.stack ?? '' : ''
      this.setState({ hasError: true, errorMessage, componentStack })
    }

    this.webRejectionHandler = (event: any) => {
      const reason = event?.reason
      const errorMessage = reason instanceof Error ? reason.message : String(reason ?? 'Unhandled rejection')
      const componentStack = reason instanceof Error ? reason.stack ?? '' : ''
      this.setState({ hasError: true, errorMessage, componentStack })
    }

    window.addEventListener('error', this.webErrorHandler)
    window.addEventListener('unhandledrejection', this.webRejectionHandler)
  }

  componentWillUnmount() {
    if (Platform.OS !== 'web') {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    if (this.webErrorHandler) {
      window.removeEventListener('error', this.webErrorHandler)
    }

    if (this.webRejectionHandler) {
      window.removeEventListener('unhandledrejection', this.webRejectionHandler)
    }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[ErrorBoundary] error', error)
    console.error('[ErrorBoundary] componentStack', info.componentStack)

    const errorMessage = error instanceof Error ? error.message : String(error)
    const componentStack = info?.componentStack ?? ''
    this.setState({ errorMessage, componentStack })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
            Ocurrió un error en la interfaz
          </Text>
          {!!this.state.errorMessage && (
            <Text style={{ marginBottom: 12 }} selectable>
              {this.state.errorMessage}
            </Text>
          )}
          <ScrollView style={{ flex: 1 }}>
            <Text selectable>{this.state.componentStack}</Text>
          </ScrollView>
        </View>
      )
    }

    return this.props.children
  }
}

export default function App() {
  console.log('[App] Component rendering...');
  const [appIsReady, setAppIsReady] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [showRegister, setShowRegister] = useState(false)
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    console.log('[App] showRegister state changed:', showRegister);
  }, [showRegister]);

  useEffect(() => {
    if (isAuthenticated) {
      setShowWelcome(false)
    }
    console.log('[App] isAuthenticated state changed:', isAuthenticated);
  }, [isAuthenticated])

  useEffect(() => {
    async function prepare() {
      try {
        console.log('[App] Starting prepare...');
        
        // Cargar fuentes de iconos
        console.log('[App] Loading fonts...');
        try {
          await Font.loadAsync({
            ...Ionicons.font,
          })
          console.log('[App] Fonts loaded successfully');
        } catch (fontError) {
          console.error('[App] Font loading error:', fontError);
        }
        
        // Verificar autenticación con timeout de 5s para no bloquear la app
        console.log('[App] Checking auth...');
        try {
          await Promise.race([
            checkAuth(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Auth check timeout')), 5000))
          ])
          console.log('[App] Auth check completed');
        } catch (authError) {
          console.error('[App] Auth check error:', authError);
        }
        
        // Simular carga de recursos
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log('[App] Resources loaded');
      } catch (e) {
        console.error('[App] Error in prepare:', e)
        console.warn(e)
      } finally {
        console.log('[App] Setting appIsReady to true');
        setAppIsReady(true)
        // Ocultar splash solo en plataformas nativas
        // TEMPORAL: Comentado para diagnosticar error de C++ exception
        // if (Platform.OS !== 'web') {
        //   try {
        //     await SplashScreen.hideAsync()
        //     console.log('[App] Splash hidden');
        //   } catch (splashError) {
        //     console.error('[App] Splash hide error:', splashError);
        //   }
        // }
      }
    }

    prepare()
  }, [])
  
  console.log('[App] appIsReady:', appIsReady);
  console.log('[App] isLoading:', isLoading);
  console.log('[App] isAuthenticated:', isAuthenticated);
  
  if (!appIsReady) {
    console.log('[App] Returning LoadingScreen - app not ready');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <Text style={{ fontSize: 18, marginBottom: 10 }}>Cargando aplicación...</Text>
        <Text style={{ fontSize: 14, color: '#666' }}>appIsReady: {String(appIsReady)}</Text>
      </View>
    );
  }

  const handleLogin = () => {
    setShowWelcome(false)
    setShowRegister(false)
    console.log('[App] handleLogin called - showRegister set to false');
  }

  const handleRegister = () => {
    setShowWelcome(false)
    setShowRegister(true)
    console.log('[App] handleRegister called - showRegister set to true');
  }

  const handleBackToWelcome = () => {
    setShowWelcome(true)
    setShowRegister(false)
    console.log('[App] handleBackToWelcome called - showRegister set to false');
  }

  console.log('[App] Rendering with showWelcome:', showWelcome, 'showRegister:', showRegister, 'isAuthenticated:', isAuthenticated);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <RegisterProvider>
              <NavigationContainer key={`nav-${showRegister}-${isAuthenticated}`}>
                <StatusBar style="auto" />
                {isLoading ? (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                    <Text style={{ fontSize: 18 }}>Verificando autenticación...</Text>
                  </View>
                ) : isAuthenticated ? (
                  <Navigation />
                ) : showWelcome ? (
                  <WelcomeScreen onLogin={handleLogin} onRegister={handleRegister} />
                ) : showRegister ? (
                  console.log('[App] Rendering AuthStack.Navigator for registration flow'),
                  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
                    <AuthStack.Screen name="RegisterStep1" component={RegisterStep1Screen} />
                    <AuthStack.Screen name="RegisterStep2" component={RegisterStep2Screen} />
                    <AuthStack.Screen name="RegisterStep3" component={RegisterStep3Screen} />
                    <AuthStack.Screen name="Login">
                      {(props) => <LoginScreen {...props} onBackToWelcome={handleBackToWelcome} />}
                    </AuthStack.Screen>
                  </AuthStack.Navigator>
                ) : (
                  <LoginScreen onBackToWelcome={handleBackToWelcome} />
                )}
              </NavigationContainer>
            </RegisterProvider>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  )
}

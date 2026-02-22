import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

// Custom Components
import { CustomTabBar } from '../components/CustomTabBar'

// Screens
import DashboardScreen from '../screens/DashboardScreen'
import CatedrasScreen from '../screens/CatedrasScreen'
import ChairPatientsScreen from '../screens/ChairPatientsScreen'
import AddScreen from '../screens/AddScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import SettingsScreen from '../screens/SettingsScreen'
import PatientsScreen from '../screens/PatientsScreen'
import PatientDetailScreen from '../screens/PatientDetailScreen'
import ProcedureViewScreen from '../screens/ProcedureViewScreen'
import ProcedureScheduleScreen from '../screens/ProcedureScheduleScreen'
import RegisterStep1Screen from '../screens/RegisterStep1Screen'
import RegisterStep2Screen from '../screens/RegisterStep2Screen'
import RegisterStep3Screen from '../screens/RegisterStep3Screen'
import MyPatientsScreen from '../screens/MyPatientsScreen'
import AssignmentDetailScreen from '../screens/AssignmentDetailScreen'
import CreatePatientScreen from '../screens/CreatePatientScreen'
import EditPatientScreen from '../screens/EditPatientScreen'
import OdontogramScreen from '../screens/OdontogramScreen'
import CreateProcedureScreen from '../screens/CreateProcedureScreen'
import ProfileEditScreen from '../screens/ProfileEditScreen'
import ProcedureHistoryScreen from '../screens/ProcedureHistoryScreen'
import NotificationPreferencesScreen from '../screens/NotificationPreferencesScreen'
import { AppLayout } from '../components/AppLayout'
import { SafeAreaView } from 'react-native-safe-area-context'

// Navegadores
const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

// Stack Navigator para Cátedras
function CatedrasStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="CatedrasList" 
        component={CatedrasScreen}
        options={{ title: 'Cátedras' }}
      />
      <Stack.Screen 
        name="ChairPatients" 
        component={ChairPatientsScreen}
        options={{ title: 'Pacientes' }}
      />
      <Stack.Screen 
        name="PatientDetail" 
        component={PatientDetailScreen}
        options={{ title: 'Ficha del Paciente' }}
      />
      <Stack.Screen 
        name="ProcedureView" 
        component={ProcedureViewScreen}
        options={{ title: 'Ver Procedimiento' }}
      />
      <Stack.Screen 
        name="ProcedureSchedule" 
        component={ProcedureScheduleScreen}
        options={{ title: 'Agendar Procedimiento' }}
      />
      <Stack.Screen 
        name="CreatePatient" 
        component={CreatePatientScreen}
        options={{ title: 'Nuevo Paciente' }}
      />
      <Stack.Screen 
        name="EditPatient" 
        component={EditPatientScreen}
        options={{ title: 'Editar Paciente' }}
      />
      <Stack.Screen 
        name="CreateProcedure" 
        component={CreateProcedureScreen}
        options={{ title: 'Agregar Procedimiento' }}
      />
      <Stack.Screen 
        name="ProfileEdit" 
        component={ProfileEditScreen}
        options={{ title: 'Mi Perfil' }}
      />
      <Stack.Screen 
        name="MenuMyPatients" 
        component={MyPatientsScreen}
        options={{ title: 'Mis Pacientes' }}
      />
      <Stack.Screen 
        name="ProcedureHistory" 
        component={ProcedureHistoryScreen}
        options={{ title: 'Historial de Procedimientos' }}
      />
      <Stack.Screen 
        name="AssignmentDetail" 
        component={AssignmentDetailScreen}
        options={{ title: 'Detalle de Asignación' }}
      />
      <Stack.Screen 
        name="Odontogram" 
        component={OdontogramScreen}
        options={{ title: 'Odontograma' }}
      />
    </Stack.Navigator>
  )
}

// Stack Navigator para Pacientes
function PatientsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="PatientsList" 
        component={PatientsScreen}
        options={{ title: 'Pacientes' }}
      />
      <Stack.Screen 
        name="PatientDetail" 
        component={PatientDetailScreen}
        options={{ title: 'Detalle del Paciente' }}
      />
      <Stack.Screen 
        name="CreateProcedure" 
        component={CreateProcedureScreen}
        options={{ title: 'Agregar Procedimiento' }}
      />
      <Stack.Screen 
        name="ProcedureView" 
        component={ProcedureViewScreen}
        options={{ title: 'Ver Procedimiento' }}
      />
    </Stack.Navigator>
  )
}

// Stack Navigator para Mis Pacientes Asignados
function MyPatientsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="MyPatientsList" 
        component={MyPatientsScreen}
        options={{ title: 'Mis Pacientes' }}
      />
      <Stack.Screen 
        name="AssignmentDetail" 
        component={AssignmentDetailScreen}
        options={{ title: 'Detalle de Asignación' }}
      />
      <Stack.Screen 
        name="Odontogram" 
        component={OdontogramScreen}
        options={{ title: 'Odontograma' }}
      />
      <Stack.Screen 
        name="ProcedureView" 
        component={ProcedureViewScreen}
        options={{ title: 'Ver Procedimiento' }}
      />
      <Stack.Screen 
        name="PatientDetail" 
        component={PatientDetailScreen}
        options={{ title: 'Ficha del Paciente' }}
      />
      <Stack.Screen 
        name="CreateProcedure" 
        component={CreateProcedureScreen}
        options={{ title: 'Agregar Procedimiento' }}
      />
    </Stack.Navigator>
  )
}

// Stack Navigator para Agregar
function AddStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="AddMain" 
        component={AddScreen}
        options={{ title: 'Agregar' }}
      />
      <Stack.Screen 
        name="CreatePatient" 
        component={CreatePatientScreen}
        options={{ title: 'Nuevo Paciente' }}
      />
      <Stack.Screen 
        name="EditPatient" 
        component={EditPatientScreen}
        options={{ title: 'Editar Paciente' }}
      />
      <Stack.Screen 
        name="Odontogram" 
        component={OdontogramScreen}
        options={{ title: 'Odontograma' }}
      />
      <Stack.Screen 
        name="PatientDetail" 
        component={PatientDetailScreen}
        options={{ title: 'Ficha del Paciente' }}
      />
      <Stack.Screen 
        name="ProcedureView" 
        component={ProcedureViewScreen}
        options={{ title: 'Ver Procedimiento' }}
      />
      <Stack.Screen 
        name="CreateProcedure" 
        component={CreateProcedureScreen}
        options={{ title: 'Agregar Procedimiento' }}
      />
    </Stack.Navigator>
  )
}

// Stack Navigator para Notificaciones
function NotificationsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="NotificationsList" 
        component={NotificationsScreen}
        options={{ title: 'Notificaciones' }}
      />
      <Stack.Screen 
        name="NotificationPreferences" 
        component={NotificationPreferencesScreen}
        options={{ title: 'Preferencias de Notificaciones' }}
      />
    </Stack.Navigator>
  )
}

// Tab Navigator Principal
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Catedras" 
        component={CatedrasStack}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen 
        name="MyPatients" 
        component={MyPatientsStack}
        options={{ title: 'Mis Pacientes' }}
      />
      <Tab.Screen 
        name="Add" 
        component={AddStack}
        options={{ title: 'Agregar' }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsStack}
        options={{ title: 'Notificaciones' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Configuración' }}
      />
    </Tab.Navigator>
  )
}

// Navigation Container Principal
export default function Navigation() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <AppLayout>
        <MainTabs />
      </AppLayout>
    </SafeAreaView>
  )
}

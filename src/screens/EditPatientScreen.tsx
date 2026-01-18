import React, { useState, useEffect } from 'react'
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { TextInput, Button, HelperText, SegmentedButtons } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { api } from '../lib/api'

export default function EditPatientScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { patientId } = route.params as { patientId: number }
  
  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [documentType, setDocumentType] = useState('CI')
  const [documentNumber, setDocumentNumber] = useState('')
  const [birthdate, setBirthdate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [gender, setGender] = useState('M')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchPatientData()
  }, [patientId])

  const fetchPatientData = async () => {
    try {
      const response = await api.patients.get(patientId)
      const patient = response.data.data as any
      
      setFirstName(patient.first_name || '')
      setLastName(patient.last_name || '')
      setDocumentType(patient.document_type || 'CI')
      setDocumentNumber(patient.document_number || '')
      setBirthdate(patient.birthdate ? new Date(patient.birthdate) : new Date())
      setGender(patient.gender || 'M')
      setCity(patient.city || '')
      setAddress(patient.address || '')
      setPhone(patient.phone || '')
      setEmergencyContact(patient.emergency_contact || '')
      setEmergencyPhone(patient.emergency_phone || '')
    } catch (error: any) {
      console.error('Error fetching patient:', error)
      Alert.alert('Error', 'No se pudo cargar la información del paciente')
      navigation.goBack()
    } finally {
      setFetching(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!firstName.trim()) newErrors.firstName = 'El nombre es requerido'
    if (!lastName.trim()) newErrors.lastName = 'El apellido es requerido'
    if (!documentNumber.trim()) newErrors.documentNumber = 'El número de documento es requerido'
    if (documentNumber.length < 6) newErrors.documentNumber = 'El documento debe tener al menos 6 caracteres'
    if (!city.trim()) newErrors.city = 'La ciudad es requerida'
    if (!phone.trim()) newErrors.phone = 'El teléfono es requerido'

    if (birthdate >= new Date()) {
      newErrors.birthdate = 'La fecha de nacimiento debe ser en el pasado'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos')
      return
    }

    setLoading(true)
    try {
      await api.patients.update(patientId, {
        first_name: firstName,
        last_name: lastName,
        document_type: documentType,
        document_number: documentNumber,
        birthdate: birthdate.toISOString().split('T')[0],
        gender,
        city,
        address,
        phone,
        emergency_contact: emergencyContact,
        emergency_phone: emergencyPhone,
      })

      Alert.alert(
        'Éxito',
        'Paciente actualizado exitosamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      )
    } catch (error: any) {
      console.error('Error updating patient:', error)
      const errorMessage = error.response?.data?.message || 'Error al actualizar el paciente'
      Alert.alert('Error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setBirthdate(selectedDate)
    }
  }

  if (fetching) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00BCD4" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <TextInput
            label="Nombre *"
            value={firstName}
            onChangeText={setFirstName}
            mode="outlined"
            style={styles.input}
            error={!!errors.firstName}
          />
          {errors.firstName && <HelperText type="error">{errors.firstName}</HelperText>}

          <TextInput
            label="Apellido *"
            value={lastName}
            onChangeText={setLastName}
            mode="outlined"
            style={styles.input}
            error={!!errors.lastName}
          />
          {errors.lastName && <HelperText type="error">{errors.lastName}</HelperText>}
        </View>

        <View style={styles.section}>
          <SegmentedButtons
            value={documentType}
            onValueChange={setDocumentType}
            buttons={[
              { value: 'CI', label: 'CI' },
              { value: 'RUC', label: 'RUC' },
              { value: 'Pasaporte', label: 'Pasaporte' },
            ]}
            style={styles.segmentedButtons}
          />

          <TextInput
            label="Número de Documento *"
            value={documentNumber}
            onChangeText={setDocumentNumber}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
            error={!!errors.documentNumber}
          />
          {errors.documentNumber && <HelperText type="error">{errors.documentNumber}</HelperText>}
        </View>

        <View style={styles.section}>
          <Button
            mode="outlined"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
            icon="calendar"
          >
            Fecha de Nacimiento: {birthdate.toLocaleDateString()}
          </Button>
          {errors.birthdate && <HelperText type="error">{errors.birthdate}</HelperText>}

          {showDatePicker && (
            <DateTimePicker
              value={birthdate}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          <SegmentedButtons
            value={gender}
            onValueChange={setGender}
            buttons={[
              { value: 'M', label: 'Masculino' },
              { value: 'F', label: 'Femenino' },
              { value: 'O', label: 'Otro' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        <View style={styles.section}>
          <TextInput
            label="Ciudad *"
            value={city}
            onChangeText={setCity}
            mode="outlined"
            style={styles.input}
            error={!!errors.city}
          />
          {errors.city && <HelperText type="error">{errors.city}</HelperText>}

          <TextInput
            label="Dirección"
            value={address}
            onChangeText={setAddress}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.section}>
          <TextInput
            label="Teléfono *"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
            error={!!errors.phone}
          />
          {errors.phone && <HelperText type="error">{errors.phone}</HelperText>}

          <TextInput
            label="Contacto de Emergencia"
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Teléfono de Emergencia"
            value={emergencyPhone}
            onChangeText={setEmergencyPhone}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={loading}
            disabled={loading}
          >
            Guardar Cambios
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  dateButton: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
})

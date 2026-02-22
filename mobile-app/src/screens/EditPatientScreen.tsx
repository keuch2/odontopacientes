import React, { useState, useEffect } from 'react'
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { TextInput, Button, HelperText, SegmentedButtons, Switch } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { api } from '../lib/api'
import { AppText } from '../components/ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'

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
  const [isPediatric, setIsPediatric] = useState(false)
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  
  // Medical history state
  const [hasAllergies, setHasAllergies] = useState(false)
  const [allergiesDescription, setAllergiesDescription] = useState('')
  const [takesMedication, setTakesMedication] = useState(false)
  const [medicationDescription, setMedicationDescription] = useState('')
  const [hasSystemicDisease, setHasSystemicDisease] = useState(false)
  const [systemicDiseaseDescription, setSystemicDiseaseDescription] = useState('')
  const [isPregnant, setIsPregnant] = useState(false)
  const [hasBleedingDisorder, setHasBleedingDisorder] = useState(false)
  const [bleedingDisorderDescription, setBleedingDisorderDescription] = useState('')
  const [hasHeartCondition, setHasHeartCondition] = useState(false)
  const [heartConditionDescription, setHeartConditionDescription] = useState('')
  const [hasDiabetes, setHasDiabetes] = useState(false)
  const [diabetesDescription, setDiabetesDescription] = useState('')
  const [hasHypertension, setHasHypertension] = useState(false)
  const [smokes, setSmokes] = useState(false)
  const [otherConditions, setOtherConditions] = useState('')

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
      setIsPediatric(!!patient.is_pediatric)
      setCity(patient.city || '')
      setAddress(patient.address || '')
      setPhone(patient.phone || '')
      setEmergencyContact(patient.emergency_contact || '')
      setEmergencyPhone(patient.emergency_phone || '')
      
      // Medical history
      setHasAllergies(!!patient.has_allergies)
      setAllergiesDescription(patient.allergies_description || '')
      setTakesMedication(!!patient.takes_medication)
      setMedicationDescription(patient.medication_description || '')
      setHasSystemicDisease(!!patient.has_systemic_disease)
      setSystemicDiseaseDescription(patient.systemic_disease_description || '')
      setIsPregnant(!!patient.is_pregnant)
      setHasBleedingDisorder(!!patient.has_bleeding_disorder)
      setBleedingDisorderDescription(patient.bleeding_disorder_description || '')
      setHasHeartCondition(!!patient.has_heart_condition)
      setHeartConditionDescription(patient.heart_condition_description || '')
      setHasDiabetes(!!patient.has_diabetes)
      setDiabetesDescription(patient.diabetes_description || '')
      setHasHypertension(!!patient.has_hypertension)
      setSmokes(!!patient.smokes)
      setOtherConditions(patient.other_conditions || '')
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
        is_pediatric: isPediatric,
        city,
        address,
        phone,
        emergency_contact: emergencyContact,
        emergency_phone: emergencyPhone,
        has_allergies: hasAllergies,
        allergies_description: allergiesDescription,
        takes_medication: takesMedication,
        medication_description: medicationDescription,
        has_systemic_disease: hasSystemicDisease,
        systemic_disease_description: systemicDiseaseDescription,
        is_pregnant: isPregnant,
        has_bleeding_disorder: hasBleedingDisorder,
        bleeding_disorder_description: bleedingDisorderDescription,
        has_heart_condition: hasHeartCondition,
        heart_condition_description: heartConditionDescription,
        has_diabetes: hasDiabetes,
        diabetes_description: diabetesDescription,
        has_hypertension: hasHypertension,
        smokes,
        other_conditions: otherConditions,
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
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <AppText variant="h2" color="brandNavy" weight="bold">
            Editar Ficha del Paciente
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandTurquoise} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <AppText variant="h2" color="brandNavy" weight="bold">
          Editar Ficha del Paciente
        </AppText>
      </View>
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

          <View style={styles.switchRow}>
            <AppText variant="body" color="textPrimary" style={styles.switchLabel}>
              ¿Es paciente pediátrico?
            </AppText>
            <Switch value={isPediatric} onValueChange={setIsPediatric} color={colors.brandTurquoise} />
          </View>
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

        <View style={styles.sectionHeader}>
          <AppText variant="h3" weight="bold" color="brandNavy">
            Historia Médica (Anamnesis)
          </AppText>
        </View>

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <AppText variant="body" color="textPrimary" style={styles.switchLabel}>
              ¿Tiene alergias?
            </AppText>
            <Switch value={hasAllergies} onValueChange={setHasAllergies} color={colors.brandTurquoise} />
          </View>
          {hasAllergies && (
            <TextInput
              label="Describa las alergias"
              value={allergiesDescription}
              onChangeText={setAllergiesDescription}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={2}
            />
          )}

          <View style={styles.switchRow}>
            <AppText variant="body" color="textPrimary" style={styles.switchLabel}>
              ¿Toma medicamentos?
            </AppText>
            <Switch value={takesMedication} onValueChange={setTakesMedication} color={colors.brandTurquoise} />
          </View>
          {takesMedication && (
            <TextInput
              label="Describa los medicamentos"
              value={medicationDescription}
              onChangeText={setMedicationDescription}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={2}
            />
          )}

          <View style={styles.switchRow}>
            <AppText variant="body" color="textPrimary" style={styles.switchLabel}>
              ¿Tiene enfermedad sistémica?
            </AppText>
            <Switch value={hasSystemicDisease} onValueChange={setHasSystemicDisease} color={colors.brandTurquoise} />
          </View>
          {hasSystemicDisease && (
            <TextInput
              label="Describa la enfermedad"
              value={systemicDiseaseDescription}
              onChangeText={setSystemicDiseaseDescription}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={2}
            />
          )}

          <View style={styles.switchRow}>
            <AppText variant="body" color="textPrimary" style={styles.switchLabel}>
              ¿Está embarazada?
            </AppText>
            <Switch value={isPregnant} onValueChange={setIsPregnant} color={colors.brandTurquoise} />
          </View>

          <View style={styles.switchRow}>
            <AppText variant="body" color="textPrimary" style={styles.switchLabel}>
              ¿Tiene trastorno de sangrado?
            </AppText>
            <Switch value={hasBleedingDisorder} onValueChange={setHasBleedingDisorder} color={colors.brandTurquoise} />
          </View>
          {hasBleedingDisorder && (
            <TextInput
              label="Describa el trastorno"
              value={bleedingDisorderDescription}
              onChangeText={setBleedingDisorderDescription}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={2}
            />
          )}

          <View style={styles.switchRow}>
            <AppText variant="body" color="textPrimary" style={styles.switchLabel}>
              ¿Tiene condición cardíaca?
            </AppText>
            <Switch value={hasHeartCondition} onValueChange={setHasHeartCondition} color={colors.brandTurquoise} />
          </View>
          {hasHeartCondition && (
            <TextInput
              label="Describa la condición"
              value={heartConditionDescription}
              onChangeText={setHeartConditionDescription}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={2}
            />
          )}

          <View style={styles.switchRow}>
            <AppText variant="body" color="textPrimary" style={styles.switchLabel}>
              ¿Tiene diabetes?
            </AppText>
            <Switch value={hasDiabetes} onValueChange={setHasDiabetes} color={colors.brandTurquoise} />
          </View>
          {hasDiabetes && (
            <TextInput
              label="Describa el tipo/tratamiento"
              value={diabetesDescription}
              onChangeText={setDiabetesDescription}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={2}
            />
          )}

          <View style={styles.switchRow}>
            <AppText variant="body" color="textPrimary" style={styles.switchLabel}>
              ¿Tiene hipertensión?
            </AppText>
            <Switch value={hasHypertension} onValueChange={setHasHypertension} color={colors.brandTurquoise} />
          </View>

          <View style={styles.switchRow}>
            <AppText variant="body" color="textPrimary" style={styles.switchLabel}>
              ¿Fuma?
            </AppText>
            <Switch value={smokes} onValueChange={setSmokes} color={colors.brandTurquoise} />
          </View>

          <TextInput
            label="Otras condiciones o notas médicas"
            value={otherConditions}
            onChangeText={setOtherConditions}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            labelStyle={styles.cancelButtonLabel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.saveButton}
            buttonColor={colors.brandTurquoise}
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.brandNavy,
  },
  cancelButtonLabel: {
    color: colors.brandNavy,
  },
  saveButton: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  switchLabel: {
    flex: 1,
    marginRight: spacing.sm,
  },
})

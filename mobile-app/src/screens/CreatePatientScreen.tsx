import React, { useState } from 'react'
import { View, ScrollView, StyleSheet, Alert } from 'react-native'
import { TextInput, Button, HelperText, SegmentedButtons, Switch } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import BirthDatePicker from '../components/BirthDatePicker'
import { api } from '../lib/api'

export default function CreatePatientScreen() {
  const navigation = useNavigation()
  
  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [documentType, setDocumentType] = useState('CI')
  const [documentNumber, setDocumentNumber] = useState('')
  const [birthdate, setBirthdate] = useState(() => {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 30)
    return date
  })
  const [gender, setGender] = useState('M')
  const [isPediatric, setIsPediatric] = useState(false)
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  
  // Medical history (Anamnesis)
  const [hasAllergies, setHasAllergies] = useState(false)
  const [allergiesDescription, setAllergiesDescription] = useState('')
  const [takesMedication, setTakesMedication] = useState(false)
  const [medicationDescription, setMedicationDescription] = useState('')
  const [hasSystemicDisease, setHasSystemicDisease] = useState(false)
  const [systemicDiseaseDescription, setSystemicDiseaseDescription] = useState('')
  const [isPregnant, setIsPregnant] = useState<boolean | null>(null)
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
  
  // Loading state
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!firstName.trim()) newErrors.firstName = 'El nombre es requerido'
    if (!lastName.trim()) newErrors.lastName = 'El apellido es requerido'
    if (!documentNumber.trim()) newErrors.documentNumber = 'El número de documento es requerido'
    if (documentNumber.length < 6) newErrors.documentNumber = 'El documento debe tener al menos 6 caracteres'
    if (!city.trim()) newErrors.city = 'La ciudad es requerida'
    if (!phone.trim()) newErrors.phone = 'El teléfono es requerido'

    // Validar que la fecha de nacimiento sea en el pasado
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
      const response = await api.patients.create({
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
        'Paciente creado exitosamente',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navegar a la pantalla de detalle del paciente
              navigation.goBack()
            },
          },
        ]
      )
    } catch (error: any) {
      console.error('Error creating patient:', error)
      const errorMessage = error.response?.data?.message || 'Error al crear el paciente'
      Alert.alert('Error', errorMessage)
    } finally {
      setLoading(false)
    }
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
          <BirthDatePicker
            value={birthdate}
            onChange={setBirthdate}
            maximumDate={new Date()}
          />
          {errors.birthdate && <HelperText type="error">{errors.birthdate}</HelperText>}

          <SegmentedButtons
            value={gender}
            onValueChange={setGender}
            buttons={[
              { value: 'M', label: 'Masculino' },
              { value: 'F', label: 'Femenino' },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <TextInput
                label="¿Es paciente pediátrico?"
                mode="outlined"
                style={styles.checkboxLabel}
                disabled
                value=""
              />
            </View>
            <Switch value={isPediatric} onValueChange={setIsPediatric} />
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

        <View style={styles.section}>
          <TextInput
            label="Anamnesis"
            mode="outlined"
            style={styles.sectionTitle}
            disabled
            value=""
          />
          
          <View style={styles.checkboxRow}>
            <TextInput
              label="¿Tiene algún tipo de alergia?"
              mode="outlined"
              style={styles.checkboxLabel}
              disabled
              value=""
            />
            <SegmentedButtons
              value={hasAllergies ? 'yes' : 'no'}
              onValueChange={(value) => setHasAllergies(value === 'yes')}
              buttons={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Sí' },
              ]}
              style={styles.yesNoButtons}
            />
          </View>
          {hasAllergies && (
            <TextInput
              label="¿Cuál(es)?"
              value={allergiesDescription}
              onChangeText={setAllergiesDescription}
              mode="outlined"
              style={styles.input}
              multiline
            />
          )}

          <View style={styles.checkboxRow}>
            <TextInput
              label="¿Toma algún tipo de medicación?"
              mode="outlined"
              style={styles.checkboxLabel}
              disabled
              value=""
            />
            <SegmentedButtons
              value={takesMedication ? 'yes' : 'no'}
              onValueChange={(value) => setTakesMedication(value === 'yes')}
              buttons={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Sí' },
              ]}
              style={styles.yesNoButtons}
            />
          </View>
          {takesMedication && (
            <TextInput
              label="¿Cuál(es)?"
              value={medicationDescription}
              onChangeText={setMedicationDescription}
              mode="outlined"
              style={styles.input}
              multiline
            />
          )}

          <View style={styles.checkboxRow}>
            <TextInput
              label="¿Padece alguna enfermedad sistémica?"
              mode="outlined"
              style={styles.checkboxLabel}
              disabled
              value=""
            />
            <SegmentedButtons
              value={hasSystemicDisease ? 'yes' : 'no'}
              onValueChange={(value) => setHasSystemicDisease(value === 'yes')}
              buttons={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Sí' },
              ]}
              style={styles.yesNoButtons}
            />
          </View>
          {hasSystemicDisease && (
            <TextInput
              label="¿Cuál(es)?"
              value={systemicDiseaseDescription}
              onChangeText={setSystemicDiseaseDescription}
              mode="outlined"
              style={styles.input}
              multiline
            />
          )}

          {gender === 'F' && (
            <View style={styles.checkboxRow}>
              <TextInput
                label="¿Está embarazada?"
                mode="outlined"
                style={styles.checkboxLabel}
                disabled
                value=""
              />
              <SegmentedButtons
                value={isPregnant === null ? 'unknown' : isPregnant ? 'yes' : 'no'}
                onValueChange={(value) => setIsPregnant(value === 'yes' ? true : value === 'no' ? false : null)}
                buttons={[
                  { value: 'no', label: 'No' },
                  { value: 'yes', label: 'Sí' },
                ]}
                style={styles.yesNoButtons}
              />
            </View>
          )}

          <View style={styles.checkboxRow}>
            <TextInput
              label="¿Tiene problemas de coagulación?"
              mode="outlined"
              style={styles.checkboxLabel}
              disabled
              value=""
            />
            <SegmentedButtons
              value={hasBleedingDisorder ? 'yes' : 'no'}
              onValueChange={(value) => setHasBleedingDisorder(value === 'yes')}
              buttons={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Sí' },
              ]}
              style={styles.yesNoButtons}
            />
          </View>
          {hasBleedingDisorder && (
            <TextInput
              label="Descripción"
              value={bleedingDisorderDescription}
              onChangeText={setBleedingDisorderDescription}
              mode="outlined"
              style={styles.input}
              multiline
            />
          )}

          <View style={styles.checkboxRow}>
            <TextInput
              label="¿Padece del corazón?"
              mode="outlined"
              style={styles.checkboxLabel}
              disabled
              value=""
            />
            <SegmentedButtons
              value={hasHeartCondition ? 'yes' : 'no'}
              onValueChange={(value) => setHasHeartCondition(value === 'yes')}
              buttons={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Sí' },
              ]}
              style={styles.yesNoButtons}
            />
          </View>
          {hasHeartCondition && (
            <TextInput
              label="Descripción"
              value={heartConditionDescription}
              onChangeText={setHeartConditionDescription}
              mode="outlined"
              style={styles.input}
              multiline
            />
          )}

          <View style={styles.checkboxRow}>
            <TextInput
              label="¿Es diabético?"
              mode="outlined"
              style={styles.checkboxLabel}
              disabled
              value=""
            />
            <SegmentedButtons
              value={hasDiabetes ? 'yes' : 'no'}
              onValueChange={(value) => setHasDiabetes(value === 'yes')}
              buttons={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Sí' },
              ]}
              style={styles.yesNoButtons}
            />
          </View>
          {hasDiabetes && (
            <TextInput
              label="Descripción"
              value={diabetesDescription}
              onChangeText={setDiabetesDescription}
              mode="outlined"
              style={styles.input}
              multiline
            />
          )}

          <View style={styles.checkboxRow}>
            <TextInput
              label="¿Tiene hipertensión?"
              mode="outlined"
              style={styles.checkboxLabel}
              disabled
              value=""
            />
            <SegmentedButtons
              value={hasHypertension ? 'yes' : 'no'}
              onValueChange={(value) => setHasHypertension(value === 'yes')}
              buttons={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Sí' },
              ]}
              style={styles.yesNoButtons}
            />
          </View>

          <View style={styles.checkboxRow}>
            <TextInput
              label="¿Fuma?"
              mode="outlined"
              style={styles.checkboxLabel}
              disabled
              value=""
            />
            <SegmentedButtons
              value={smokes ? 'yes' : 'no'}
              onValueChange={(value) => setSmokes(value === 'yes')}
              buttons={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Sí' },
              ]}
              style={styles.yesNoButtons}
            />
          </View>

          <TextInput
            label="Otras condiciones"
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
            Crear Paciente
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
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  checkboxRow: {
    marginBottom: 16,
  },
  checkboxLabel: {
    marginBottom: 8,
  },
  yesNoButtons: {
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
})

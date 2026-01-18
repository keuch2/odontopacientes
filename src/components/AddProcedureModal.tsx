import React, { useState, useEffect } from 'react';
import {
  Modal,
  Portal,
  Button,
  TextInput,
  SegmentedButtons,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuthStore } from '../store/auth';

interface Chair {
  id: number;
  name: string;
}

interface Treatment {
  id: number;
  name: string;
  chair_id: number;
}

interface AddProcedureModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
  patientId: number;
  preselectedToothFdi?: string;
}

const TOOTH_SURFACES = [
  { label: 'Oclusal', value: 'O' },
  { label: 'Mesial', value: 'M' },
  { label: 'Distal', value: 'D' },
  { label: 'Vestibular', value: 'V' },
  { label: 'Lingual/Palatino', value: 'L' },
];

export default function AddProcedureModal({
  visible,
  onDismiss,
  onSuccess,
  patientId,
  preselectedToothFdi,
}: AddProcedureModalProps) {
  const token = useAuthStore((state) => state.token);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // Data
  const [chairs, setChairs] = useState<Chair[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [filteredTreatments, setFilteredTreatments] = useState<Treatment[]>([]);
  
  // Form fields
  const [selectedChairId, setSelectedChairId] = useState<number | null>(null);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<number | null>(null);
  const [toothFdi, setToothFdi] = useState(preselectedToothFdi || '');
  const [toothSurface, setToothSurface] = useState('');
  const [status, setStatus] = useState('disponible');
  const [sessionsTotal, setSessionsTotal] = useState('1');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  // Load chairs and treatments
  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  // Update preselected tooth
  useEffect(() => {
    if (preselectedToothFdi) {
      setToothFdi(preselectedToothFdi);
    }
  }, [preselectedToothFdi]);

  // Filter treatments by chair
  useEffect(() => {
    if (selectedChairId) {
      const filtered = treatments.filter(t => t.chair_id === selectedChairId);
      setFilteredTreatments(filtered);
      // Reset treatment if not in filtered list
      if (selectedTreatmentId && !filtered.find(t => t.id === selectedTreatmentId)) {
        setSelectedTreatmentId(null);
      }
    } else {
      setFilteredTreatments([]);
      setSelectedTreatmentId(null);
    }
  }, [selectedChairId, treatments]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [chairsRes, treatmentsRes] = await Promise.all([
        fetch('http://localhost/odontopacientes/backend/public/api/chairs', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost/odontopacientes/backend/public/api/treatments', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (chairsRes.ok && treatmentsRes.ok) {
        const chairsData = await chairsRes.json();
        const treatmentsData = await treatmentsRes.json();
        setChairs(chairsData.data || []);
        setTreatments(treatmentsData.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'No se pudieron cargar las cátedras y tratamientos');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedTreatmentId) {
      Alert.alert('Error', 'Debes seleccionar un tratamiento');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost/odontopacientes/backend/public/api/patients/${patientId}/procedures`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            treatment_id: selectedTreatmentId,
            tooth_fdi: toothFdi || null,
            tooth_surface: toothSurface || null,
            status,
            sessions_total: parseInt(sessionsTotal) || 1,
            sessions_completed: 0,
            price: price ? parseFloat(price) : null,
            notes: notes || null,
          }),
        }
      );

      if (response.ok) {
        Alert.alert('Éxito', 'Procedimiento agregado correctamente');
        resetForm();
        onSuccess();
        onDismiss();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'No se pudo agregar el procedimiento');
      }
    } catch (error) {
      console.error('Error adding procedure:', error);
      Alert.alert('Error', 'Ocurrió un error al agregar el procedimiento');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedChairId(null);
    setSelectedTreatmentId(null);
    setToothFdi(preselectedToothFdi || '');
    setToothSurface('');
    setStatus('disponible');
    setSessionsTotal('1');
    setPrice('');
    setNotes('');
  };

  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.modal}
      >
        <ScrollView>
          <View style={styles.content}>
            {loadingData ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
              </View>
            ) : (
              <>
                {/* Chair Picker */}
                <View style={styles.field}>
                  <HelperText type="info" visible>
                    Cátedra *
                  </HelperText>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedChairId}
                      onValueChange={(value) => setSelectedChairId(value)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Seleccionar cátedra..." value={null} />
                      {chairs.map((chair) => (
                        <Picker.Item key={chair.id} label={chair.name} value={chair.id} />
                      ))}
                    </Picker>
                  </View>
                </View>

                {/* Treatment Picker */}
                <View style={styles.field}>
                  <HelperText type="info" visible>
                    Tratamiento *
                  </HelperText>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedTreatmentId}
                      onValueChange={(value) => setSelectedTreatmentId(value)}
                      style={styles.picker}
                      enabled={!!selectedChairId}
                    >
                      <Picker.Item label="Seleccionar tratamiento..." value={null} />
                      {filteredTreatments.map((treatment) => (
                        <Picker.Item
                          key={treatment.id}
                          label={treatment.name}
                          value={treatment.id}
                        />
                      ))}
                    </Picker>
                  </View>
                  {!selectedChairId && (
                    <HelperText type="info" visible>
                      Primero selecciona una cátedra
                    </HelperText>
                  )}
                </View>

                {/* Tooth FDI */}
                <TextInput
                  label="Diente FDI (opcional)"
                  value={toothFdi}
                  onChangeText={setToothFdi}
                  mode="outlined"
                  keyboardType="numeric"
                  maxLength={2}
                  style={styles.input}
                  placeholder="Ej: 36"
                />

                {/* Tooth Surface */}
                <View style={styles.field}>
                  <HelperText type="info" visible>
                    Superficie (opcional)
                  </HelperText>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={toothSurface}
                      onValueChange={(value) => setToothSurface(value)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Ninguna" value="" />
                      {TOOTH_SURFACES.map((surface) => (
                        <Picker.Item
                          key={surface.value}
                          label={surface.label}
                          value={surface.value}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                {/* Status */}
                <View style={styles.field}>
                  <HelperText type="info" visible>
                    Estado
                  </HelperText>
                  <SegmentedButtons
                    value={status}
                    onValueChange={setStatus}
                    buttons={[
                      { value: 'disponible', label: 'Disponible' },
                      { value: 'proceso', label: 'En Proceso' },
                      { value: 'finalizado', label: 'Finalizado' },
                      { value: 'contraindicado', label: 'Contraindicado' },
                    ]}
                    style={styles.segmented}
                  />
                </View>

                {/* Sessions Total */}
                <TextInput
                  label="Sesiones Totales"
                  value={sessionsTotal}
                  onChangeText={setSessionsTotal}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                />

                {/* Price */}
                <TextInput
                  label="Precio (Gs.) - Opcional"
                  value={price}
                  onChangeText={setPrice}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                  placeholder="0"
                />

                {/* Notes */}
                <TextInput
                  label="Notas (opcional)"
                  value={notes}
                  onChangeText={setNotes}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />

                {/* Buttons */}
                <View style={styles.buttons}>
                  <Button
                    mode="outlined"
                    onPress={handleDismiss}
                    style={styles.button}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    style={styles.button}
                    loading={loading}
                    disabled={loading}
                  >
                    Agregar
                  </Button>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  field: {
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
  },
  picker: {
    height: 50,
  },
  input: {
    marginBottom: 16,
  },
  segmented: {
    marginTop: 8,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
  },
});

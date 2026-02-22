import React, { useState, useEffect } from 'react';
import {
  Modal,
  Portal,
  Button,
  TextInput,
  SegmentedButtons,
  HelperText,
  ActivityIndicator,
  Checkbox,
  RadioButton,
  Divider,
  Switch,
} from 'react-native-paper';
import { Text, View, ScrollView, StyleSheet, Alert, TouchableOpacity, FlatList } from 'react-native';
import { api } from '../lib/api';

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
  selectedTeeth: string[];
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
  selectedTeeth,
}: AddProcedureModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // Data
  const [chairs, setChairs] = useState<Chair[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [filteredTreatments, setFilteredTreatments] = useState<Treatment[]>([]);
  
  // Form fields
  const [selectedChairId, setSelectedChairId] = useState<number | null>(null);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<number | null>(null);
  const [toothSurface, setToothSurface] = useState('');
  const [status, setStatus] = useState('disponible');
  const [sessionsTotal, setSessionsTotal] = useState('1');
  const [notes, setNotes] = useState('');
  const [autoAssign, setAutoAssign] = useState(false);
  const [isAbsent, setIsAbsent] = useState(false);
  const [isRepair, setIsRepair] = useState(false);

  // Load chairs and treatments
  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

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
        api.chairs.list(),
        api.treatments.list(),
      ]);

      setChairs(chairsRes.data.data || []);
      setTreatments(treatmentsRes.data.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'No se pudieron cargar las cátedras y tratamientos');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedTeeth.length === 0) {
      Alert.alert('Error', 'No hay dientes seleccionados');
      return;
    }

    if (isAbsent) {
      setLoading(true);
      try {
        for (const toothFdi of selectedTeeth) {
          await api.procedures.createForPatient(patientId, {
            tooth_fdi: toothFdi,
            status: 'ausente',
            notes: notes || 'Diente ausente',
          });
        }
        Alert.alert('Éxito', `${selectedTeeth.length} diente(s) marcado(s) como ausente(s)`);
        resetForm();
        onSuccess();
        onDismiss();
      } catch (error: any) {
        console.error('Error marking absent tooth:', error);
        const errorMessage = error.response?.data?.message || 'Ocurrió un error';
        Alert.alert('Error', errorMessage);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Validation
    if (!selectedTreatmentId) {
      Alert.alert('Error', 'Debes seleccionar un tratamiento');
      return;
    }

    setLoading(true);
    try {
      for (const toothFdi of selectedTeeth) {
        await api.procedures.createForPatient(patientId, {
          treatment_id: selectedTreatmentId,
          tooth_fdi: toothFdi,
          tooth_surface: toothSurface || null,
          is_repair: isRepair,
          status: autoAssign ? 'proceso' : status,
          sessions_total: parseInt(sessionsTotal) || 1,
          sessions_completed: 0,
          notes: notes || null,
          auto_assign: autoAssign,
        });
      }

      Alert.alert('Éxito', `Procedimiento agregado a ${selectedTeeth.length} diente(s)`);
      resetForm();
      onSuccess();
      onDismiss();
    } catch (error: any) {
      console.error('Error adding procedure:', error);
      const errorMessage = error.response?.data?.message || 'Ocurrió un error al agregar el procedimiento';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedChairId(null);
    setSelectedTreatmentId(null);
    setToothSurface('');
    setStatus('disponible');
    setSessionsTotal('1');
    setNotes('');
    setAutoAssign(false);
    setIsAbsent(false);
    setIsRepair(false);
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
                {/* Diente Ausente Toggle */}
                <View style={styles.absentRow}>
                  <Text style={styles.absentLabel}>Marcar como Diente Ausente</Text>
                  <Switch value={isAbsent} onValueChange={setIsAbsent} color="#6B7280" />
                </View>

                {isAbsent && (
                  <View style={styles.absentInfo}>
                    <Text style={styles.absentInfoText}>
                      El diente será marcado como ausente en el odontograma.
                    </Text>
                  </View>
                )}

                {/* Dientes seleccionados */}
                <View style={styles.selectedTeethSection}>
                  <Text style={styles.selectedTeethLabel}>
                    {isAbsent ? 'Dientes a marcar como ausentes:' : 'Dientes seleccionados:'}
                  </Text>
                  <View style={styles.selectedTeethChips}>
                    {selectedTeeth.map(t => (
                      <View key={t} style={styles.toothChip}>
                        <Text style={styles.toothChipText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {!isAbsent && (
                <>
                {/* Chair Selector */}
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Cátedra *</Text>
                  <View style={styles.optionsList}>
                    {chairs.map((chair) => (
                      <TouchableOpacity
                        key={chair.id}
                        style={[
                          styles.optionItem,
                          selectedChairId === chair.id && styles.optionItemSelected,
                        ]}
                        onPress={() => setSelectedChairId(chair.id)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selectedChairId === chair.id && styles.optionTextSelected,
                          ]}
                        >
                          {chair.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Treatment Selector */}
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Tratamiento *</Text>
                  {!selectedChairId ? (
                    <Text style={styles.helperText}>Primero selecciona una cátedra</Text>
                  ) : filteredTreatments.length === 0 ? (
                    <Text style={styles.helperText}>No hay tratamientos para esta cátedra</Text>
                  ) : (
                    <View style={styles.optionsList}>
                      {filteredTreatments.map((treatment) => (
                        <TouchableOpacity
                          key={treatment.id}
                          style={[
                            styles.optionItem,
                            selectedTreatmentId === treatment.id && styles.optionItemSelected,
                          ]}
                          onPress={() => setSelectedTreatmentId(treatment.id)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              selectedTreatmentId === treatment.id && styles.optionTextSelected,
                            ]}
                          >
                            {treatment.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* New vs Repair Toggle */}
                <View style={styles.repairRow}>
                  <Text style={styles.repairLabel}>Tipo de procedimiento</Text>
                  <View style={styles.repairToggle}>
                    <TouchableOpacity
                      style={[styles.repairOption, !isRepair && styles.repairOptionSelected]}
                      onPress={() => setIsRepair(false)}
                    >
                      <Text style={[styles.repairOptionText, !isRepair && styles.repairOptionTextSelected]}>Nuevo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.repairOption, isRepair && styles.repairOptionSelectedRepair]}
                      onPress={() => setIsRepair(true)}
                    >
                      <Text style={[styles.repairOptionText, isRepair && styles.repairOptionTextSelected]}>Reparación</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Tooth Surface */}
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Superficie (opcional)</Text>
                  <View style={styles.surfaceRow}>
                    {TOOTH_SURFACES.map((surface) => (
                      <TouchableOpacity
                        key={surface.value}
                        style={[
                          styles.surfaceChip,
                          toothSurface === surface.value && styles.surfaceChipSelected,
                        ]}
                        onPress={() => setToothSurface(toothSurface === surface.value ? '' : surface.value)}
                      >
                        <Text
                          style={[
                            styles.surfaceChipText,
                            toothSurface === surface.value && styles.surfaceChipTextSelected,
                          ]}
                        >
                          {surface.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Auto-assign checkbox */}
                <View style={styles.checkboxRow}>
                  <Checkbox
                    status={autoAssign ? 'checked' : 'unchecked'}
                    onPress={() => setAutoAssign(!autoAssign)}
                  />
                  <Text style={styles.checkboxLabel} onPress={() => setAutoAssign(!autoAssign)}>
                    Autoasignarme este procedimiento
                  </Text>
                </View>

                {/* Status - only show if not auto-assigning */}
                {!autoAssign && (
                  <View style={styles.field}>
                    <HelperText type="info" visible>
                      Estado
                    </HelperText>
                    <SegmentedButtons
                      value={status}
                      onValueChange={setStatus}
                      buttons={[
                        { value: 'disponible', label: 'Disp...' },
                        { value: 'proceso', label: 'En P...' },
                        { value: 'finalizado', label: 'Final...' },
                        { value: 'contraindicado', label: 'Cont...' },
                      ]}
                      style={styles.segmented}
                    />
                  </View>
                )}

                {/* Sessions Total */}
                <TextInput
                  label="Sesiones Totales"
                  value={sessionsTotal}
                  onChangeText={setSessionsTotal}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                />
                </>
                )}

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
                    style={[styles.button, isAbsent && { backgroundColor: '#6B7280' }]}
                    loading={loading}
                    disabled={loading}
                  >
                    {isAbsent ? 'Marcar Ausente' : 'Agregar'}
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
    borderRadius: 12,
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
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  optionsList: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionItemSelected: {
    backgroundColor: '#DBEAFE',
    borderBottomColor: '#BFDBFE',
  },
  optionText: {
    fontSize: 15,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  surfaceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  surfaceChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  surfaceChipSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  surfaceChipText: {
    fontSize: 13,
    color: '#4B5563',
  },
  surfaceChipTextSelected: {
    color: '#1D4ED8',
    fontWeight: '600',
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#e8f5e9',
    padding: 8,
    borderRadius: 8,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
  },
  absentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  absentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  absentInfo: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#6B7280',
  },
  absentInfoText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  repairRow: {
    marginBottom: 12,
  },
  repairLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  repairToggle: {
    flexDirection: 'row' as const,
    borderRadius: 8,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  repairOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center' as const,
    backgroundColor: '#F9FAFB',
  },
  repairOptionSelected: {
    backgroundColor: '#3B82F6',
  },
  repairOptionSelectedRepair: {
    backgroundColor: '#F59E0B',
  },
  repairOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  repairOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  selectedTeethSection: {
    marginBottom: 16,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  selectedTeethLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E40AF',
    marginBottom: 8,
  },
  selectedTeethChips: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  toothChip: {
    backgroundColor: '#DBEAFE',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  toothChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1D4ED8',
  },
});

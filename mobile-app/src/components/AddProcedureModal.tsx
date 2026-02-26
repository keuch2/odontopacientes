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
} from 'react-native-paper';
import { Text, View, ScrollView, StyleSheet, Alert, TouchableOpacity, FlatList, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';

interface Chair {
  id: number;
  name: string;
}

interface SubclassOption {
  id: number;
  name: string;
}

interface Subclass {
  id: number;
  name: string;
  options?: SubclassOption[];
}

interface Treatment {
  id: number;
  name: string;
  chair_id: number;
  subclasses?: Subclass[];
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
  
  // Menu visibility
  const [chairMenuVisible, setChairMenuVisible] = useState(false);
  const [treatmentMenuVisible, setTreatmentMenuVisible] = useState(false);
  const [subclassMenuVisible, setSubclassMenuVisible] = useState(false);
  const [optionMenuVisible, setOptionMenuVisible] = useState(false);
  
  // Form fields
  const [selectedChairId, setSelectedChairId] = useState<number | null>(null);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<number | null>(null);
  const [selectedSubclassId, setSelectedSubclassId] = useState<number | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [toothSurface, setToothSurface] = useState('');
  const [status, setStatus] = useState('disponible');
  const [sessionsTotal, setSessionsTotal] = useState('1');
  const [notes, setNotes] = useState('');
  const [autoAssign, setAutoAssign] = useState(false);
  const [isRepair, setIsRepair] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<{ uri: string; base64: string }[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

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
      if (selectedTreatmentId && !filtered.find(t => t.id === selectedTreatmentId)) {
        setSelectedTreatmentId(null);
        setSelectedSubclassId(null);
        setSelectedOptionId(null);
      }
    } else {
      setFilteredTreatments([]);
      setSelectedTreatmentId(null);
      setSelectedSubclassId(null);
      setSelectedOptionId(null);
    }
  }, [selectedChairId, treatments]);

  // Get subclasses for selected treatment
  const selectedTreatment = selectedTreatmentId
    ? filteredTreatments.find(t => t.id === selectedTreatmentId)
    : null;
  const availableSubclasses = selectedTreatment?.subclasses || [];
  const selectedSubclass = selectedSubclassId
    ? availableSubclasses.find(s => s.id === selectedSubclassId)
    : null;
  const availableOptions = selectedSubclass?.options || [];

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

    // Validation
    if (!selectedTreatmentId) {
      Alert.alert('Error', 'Debes seleccionar un tratamiento');
      return;
    }

    setLoading(true);
    try {
      const createdProcedureIds: number[] = [];
      for (const toothFdi of selectedTeeth) {
        const res = await api.procedures.createForPatient(patientId, {
          treatment_id: selectedTreatmentId,
          treatment_subclass_id: selectedSubclassId || null,
          treatment_subclass_option_id: selectedOptionId || null,
          tooth_fdi: toothFdi,
          tooth_surface: toothSurface || null,
          is_repair: isRepair,
          status: autoAssign ? 'proceso' : status,
          sessions_total: parseInt(sessionsTotal) || 1,
          sessions_completed: 0,
          notes: notes || null,
          auto_assign: autoAssign,
        });
        if (res.data?.data?.id) {
          createdProcedureIds.push(res.data.data.id);
        }
      }

      // Upload pending photos to each created procedure
      if (pendingPhotos.length > 0 && createdProcedureIds.length > 0) {
        setUploadingPhotos(true);
        for (const procId of createdProcedureIds) {
          for (const photo of pendingPhotos) {
            try {
              await api.procedurePhotos.uploadBase64ByProcedure(procId, {
                image: `data:image/jpeg;base64,${photo.base64}`,
              });
            } catch (photoErr) {
              console.error('Error uploading photo to procedure:', photoErr);
            }
          }
        }
        setUploadingPhotos(false);
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
    setSelectedSubclassId(null);
    setSelectedOptionId(null);
    setToothSurface('');
    setStatus('disponible');
    setSessionsTotal('1');
    setNotes('');
    setAutoAssign(false);
    setIsRepair(false);
    setPendingPhotos([]);
    setUploadingPhotos(false);
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Agregar Foto',
      'Selecciona una opción',
      [
        { text: 'Cámara', onPress: () => pickPhoto('camera') },
        { text: 'Galería', onPress: () => pickPhoto('gallery') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const pickPhoto = async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería');
        return;
      }
    }

    const pickerFn = source === 'camera'
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await pickerFn({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      setPendingPhotos(prev => [...prev, {
        uri: result.assets[0].uri,
        base64: result.assets[0].base64!,
      }]);
    }
  };

  const removePhoto = (index: number) => {
    setPendingPhotos(prev => prev.filter((_, i) => i !== index));
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
                {/* Dientes seleccionados */}
                <View style={styles.selectedTeethSection}>
                  <Text style={styles.selectedTeethLabel}>
                    Dientes seleccionados:
                  </Text>
                  <View style={styles.selectedTeethChips}>
                    {selectedTeeth.map(t => (
                      <View key={t} style={styles.toothChip}>
                        <Text style={styles.toothChipText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Chair Selector */}
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Cátedra *</Text>
                  <TouchableOpacity
                    style={[styles.dropdownButton, !!selectedChairId && styles.dropdownButtonSelected]}
                    onPress={() => { setChairMenuVisible(!chairMenuVisible); setTreatmentMenuVisible(false); setSubclassMenuVisible(false); }}
                  >
                    <Text style={[styles.dropdownButtonText, !!selectedChairId && styles.dropdownButtonTextSelected]}>
                      {selectedChairId ? chairs.find(c => c.id === selectedChairId)?.name : 'Seleccione una cátedra'}
                    </Text>
                    <Text style={styles.dropdownArrow}>{chairMenuVisible ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  {chairMenuVisible && (
                    <View style={styles.optionsList}>
                      <ScrollView nestedScrollEnabled style={styles.optionsScroll}>
                        {chairs.map((chair) => (
                          <TouchableOpacity
                            key={chair.id}
                            style={[styles.optionItem, selectedChairId === chair.id && styles.optionItemSelected]}
                            onPress={() => { setSelectedChairId(chair.id); setChairMenuVisible(false); }}
                          >
                            <Text style={[styles.optionText, selectedChairId === chair.id && styles.optionTextSelected]}>{chair.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Treatment Selector */}
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Tratamiento *</Text>
                  {!selectedChairId ? (
                    <Text style={styles.helperText}>Primero selecciona una cátedra</Text>
                  ) : filteredTreatments.length === 0 ? (
                    <Text style={styles.helperText}>No hay tratamientos para esta cátedra</Text>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.dropdownButton, !!selectedTreatmentId && styles.dropdownButtonSelected]}
                        onPress={() => { setTreatmentMenuVisible(!treatmentMenuVisible); setChairMenuVisible(false); setSubclassMenuVisible(false); }}
                      >
                        <Text style={[styles.dropdownButtonText, !!selectedTreatmentId && styles.dropdownButtonTextSelected]}>
                          {selectedTreatmentId ? filteredTreatments.find(t => t.id === selectedTreatmentId)?.name : 'Seleccione un tratamiento'}
                        </Text>
                        <Text style={styles.dropdownArrow}>{treatmentMenuVisible ? '▲' : '▼'}</Text>
                      </TouchableOpacity>
                      {treatmentMenuVisible && (
                        <View style={styles.optionsList}>
                          <ScrollView nestedScrollEnabled style={styles.optionsScroll}>
                            {filteredTreatments.map((treatment) => (
                              <TouchableOpacity
                                key={treatment.id}
                                style={[styles.optionItem, selectedTreatmentId === treatment.id && styles.optionItemSelected]}
                                onPress={() => { setSelectedTreatmentId(treatment.id); setSelectedSubclassId(null); setTreatmentMenuVisible(false); }}
                              >
                                <Text style={[styles.optionText, selectedTreatmentId === treatment.id && styles.optionTextSelected]}>{treatment.name}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </>
                  )}
                </View>

                {/* Subclass Selector */}
                {availableSubclasses.length > 0 && (
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Sub-clase</Text>
                    <TouchableOpacity
                      style={[styles.dropdownButton, !!selectedSubclassId && styles.dropdownButtonSelected]}
                      onPress={() => { setSubclassMenuVisible(!subclassMenuVisible); setChairMenuVisible(false); setTreatmentMenuVisible(false); }}
                    >
                      <Text style={[styles.dropdownButtonText, !!selectedSubclassId && styles.dropdownButtonTextSelected]}>
                        {selectedSubclassId ? availableSubclasses.find(s => s.id === selectedSubclassId)?.name : 'Seleccione una sub-clase'}
                      </Text>
                      <Text style={styles.dropdownArrow}>{subclassMenuVisible ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    {subclassMenuVisible && (
                      <View style={styles.optionsList}>
                        <ScrollView nestedScrollEnabled style={styles.optionsScroll}>
                          {availableSubclasses.map((subclass) => (
                            <TouchableOpacity
                              key={subclass.id}
                              style={[styles.optionItem, selectedSubclassId === subclass.id && styles.optionItemSelected]}
                              onPress={() => { setSelectedSubclassId(subclass.id); setSelectedOptionId(null); setSubclassMenuVisible(false); }}
                            >
                              <Text style={[styles.optionText, selectedSubclassId === subclass.id && styles.optionTextSelected]}>{subclass.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                )}

                {/* Subclass Option Selector */}
                {availableOptions.length > 0 && (
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Sub-clase adicional</Text>
                    <TouchableOpacity
                      style={[styles.dropdownButton, !!selectedOptionId && styles.dropdownButtonSelected]}
                      onPress={() => { setOptionMenuVisible(!optionMenuVisible); setChairMenuVisible(false); setTreatmentMenuVisible(false); setSubclassMenuVisible(false); }}
                    >
                      <Text style={[styles.dropdownButtonText, !!selectedOptionId && styles.dropdownButtonTextSelected]}>
                        {selectedOptionId ? availableOptions.find(o => o.id === selectedOptionId)?.name : 'Seleccione una opción'}
                      </Text>
                      <Text style={styles.dropdownArrow}>{optionMenuVisible ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    {optionMenuVisible && (
                      <View style={styles.optionsList}>
                        <ScrollView nestedScrollEnabled style={styles.optionsScroll}>
                          {availableOptions.map((option) => (
                            <TouchableOpacity
                              key={option.id}
                              style={[styles.optionItem, selectedOptionId === option.id && styles.optionItemSelected]}
                              onPress={() => { setSelectedOptionId(option.id); setOptionMenuVisible(false); }}
                            >
                              <Text style={[styles.optionText, selectedOptionId === option.id && styles.optionTextSelected]}>{option.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                )}

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

                {/* Photos */}
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Fotos iniciales (opcional)</Text>
                  <View style={styles.photosPreviewRow}>
                    {pendingPhotos.map((photo, idx) => (
                      <View key={idx} style={styles.photoPreviewContainer}>
                        <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                        <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => removePhoto(idx)}>
                          <Ionicons name="close-circle" size={22} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity style={styles.addPhotoBtn} onPress={showPhotoOptions}>
                      <Ionicons name="camera-outline" size={28} color="#6B7280" />
                      <Text style={styles.addPhotoBtnText}>Agregar</Text>
                    </TouchableOpacity>
                  </View>
                  {uploadingPhotos && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <ActivityIndicator size="small" />
                      <Text style={{ marginLeft: 8, fontSize: 13, color: '#6B7280' }}>Subiendo fotos...</Text>
                    </View>
                  )}
                </View>

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
                    loading={loading || uploadingPhotos}
                    disabled={loading || uploadingPhotos}
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
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  dropdownButtonText: {
    fontSize: 15,
    color: '#9CA3AF',
    flex: 1,
  },
  dropdownButtonTextSelected: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  optionsList: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: 'white',
    overflow: 'hidden' as const,
  },
  optionsScroll: {
    maxHeight: 200,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  optionItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontSize: 15,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#1D4ED8',
    fontWeight: '700' as const,
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
  photosPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  photoPreviewContainer: {
    position: 'relative',
  },
  photoPreview: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 11,
  },
  addPhotoBtn: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  addPhotoBtnText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
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

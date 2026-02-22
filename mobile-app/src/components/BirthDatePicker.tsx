import React, { useState, useMemo } from 'react'
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native'
import { Text, Button, Surface, IconButton } from 'react-native-paper'

interface BirthDatePickerProps {
  value: Date
  onChange: (date: Date) => void
  maximumDate?: Date
  minimumDate?: Date
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function BirthDatePicker({ 
  value, 
  onChange, 
  maximumDate = new Date(),
  minimumDate 
}: BirthDatePickerProps) {
  const [visible, setVisible] = useState(false)
  const [tempYear, setTempYear] = useState(value.getFullYear())
  const [tempMonth, setTempMonth] = useState(value.getMonth())
  const [tempDay, setTempDay] = useState(value.getDate())

  const currentYear = new Date().getFullYear()
  const minYear = minimumDate?.getFullYear() || 1920
  const maxYear = maximumDate?.getFullYear() || currentYear

  const years = useMemo(() => {
    const arr = []
    for (let y = maxYear; y >= minYear; y--) {
      arr.push(y)
    }
    return arr
  }, [minYear, maxYear])

  const daysInMonth = useMemo(() => {
    return new Date(tempYear, tempMonth + 1, 0).getDate()
  }, [tempYear, tempMonth])

  const days = useMemo(() => {
    const arr = []
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(d)
    }
    return arr
  }, [daysInMonth])

  const openPicker = () => {
    setTempYear(value.getFullYear())
    setTempMonth(value.getMonth())
    setTempDay(value.getDate())
    setVisible(true)
  }

  const handleConfirm = () => {
    const maxDay = new Date(tempYear, tempMonth + 1, 0).getDate()
    const finalDay = Math.min(tempDay, maxDay)
    const newDate = new Date(tempYear, tempMonth, finalDay)
    
    if (maximumDate && newDate > maximumDate) {
      onChange(maximumDate)
    } else if (minimumDate && newDate < minimumDate) {
      onChange(minimumDate)
    } else {
      onChange(newDate)
    }
    setVisible(false)
  }

  const formatDate = (date: Date) => {
    const day = date.getDate()
    const month = MONTHS[date.getMonth()]
    const year = date.getFullYear()
    return `${day} de ${month} de ${year}`
  }

  return (
    <>
      <TouchableOpacity onPress={openPicker} style={styles.dateButton}>
        <View style={styles.dateButtonContent}>
          <IconButton icon="calendar" size={20} style={styles.calendarIcon} />
          <View>
            <Text style={styles.dateLabel}>Fecha de Nacimiento</Text>
            <Text style={styles.dateValue}>{formatDate(value)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Surface style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Fecha de Nacimiento</Text>
            
            <View style={styles.pickersContainer}>
              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Año</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        tempYear === year && styles.pickerItemSelected
                      ]}
                      onPress={() => setTempYear(year)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        tempYear === year && styles.pickerItemTextSelected
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Mes</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {MONTHS.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.pickerItem,
                        tempMonth === index && styles.pickerItemSelected
                      ]}
                      onPress={() => setTempMonth(index)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        tempMonth === index && styles.pickerItemTextSelected
                      ]}>
                        {month.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Día</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        tempDay === day && styles.pickerItemSelected
                      ]}
                      onPress={() => setTempDay(day)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        tempDay === day && styles.pickerItemTextSelected
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Button 
                mode="text" 
                onPress={() => setVisible(false)}
                style={styles.modalButton}
              >
                Cancelar
              </Button>
              <Button 
                mode="contained" 
                onPress={handleConfirm}
                style={styles.modalButton}
              >
                Confirmar
              </Button>
            </View>
          </Surface>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  dateButton: {
    borderWidth: 1,
    borderColor: '#79747E',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    margin: 0,
    marginRight: 8,
  },
  dateLabel: {
    fontSize: 12,
    color: '#49454F',
  },
  dateValue: {
    fontSize: 16,
    color: '#1D1B20',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1D1B20',
  },
  pickersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#49454F',
  },
  pickerScroll: {
    height: 200,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#E8DEF8',
    borderRadius: 4,
  },
  pickerItemText: {
    fontSize: 14,
    color: '#49454F',
  },
  pickerItemTextSelected: {
    color: '#6750A4',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalButton: {
    minWidth: 100,
  },
})

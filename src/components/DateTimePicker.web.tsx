import React from 'react';
import { View, StyleSheet } from 'react-native';

interface DateTimePickerProps {
  value: Date;
  mode?: 'date' | 'time' | 'datetime';
  display?: 'default' | 'spinner' | 'calendar' | 'clock';
  onChange: (event: any, selectedDate?: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

/**
 * DateTimePicker Web Fallback
 * En web, usamos input HTML5 nativo ya que @react-native-community/datetimepicker
 * no es compatible con web
 */
export default function DateTimePicker({
  value,
  mode = 'date',
  onChange,
  minimumDate,
  maximumDate,
}: DateTimePickerProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    if (!isNaN(newDate.getTime())) {
      onChange({ type: 'set', nativeEvent: {} }, newDate);
    }
  };

  const formatDateForInput = (date: Date) => {
    if (mode === 'time') {
      return date.toTimeString().slice(0, 5);
    }
    return date.toISOString().slice(0, 10);
  };

  const inputType = mode === 'time' ? 'time' : 'date';

  return (
    <View style={styles.container}>
      <input
        type={inputType}
        value={formatDateForInput(value)}
        onChange={handleChange}
        min={minimumDate ? formatDateForInput(minimumDate) : undefined}
        max={maximumDate ? formatDateForInput(maximumDate) : undefined}
        style={{
          padding: 12,
          fontSize: 16,
          borderRadius: 8,
          border: '1px solid #cbd5e1',
          backgroundColor: '#ffffff',
          width: '100%',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

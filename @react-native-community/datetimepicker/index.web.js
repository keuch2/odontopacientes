import React from 'react';
import { View } from 'react-native';

/**
 * Mock de DateTimePicker para web
 * @react-native-community/datetimepicker no soporta web,
 * así que creamos un wrapper que usa inputs HTML5
 */
export default function DateTimePicker({
  value,
  mode = 'date',
  onChange,
  minimumDate,
  maximumDate,
  ...props
}) {
  const handleChange = (event) => {
    const newDate = new Date(event.target.value);
    if (!isNaN(newDate.getTime())) {
      onChange({ type: 'set', nativeEvent: {} }, newDate);
    }
  };

  const formatDateForInput = (date) => {
    if (mode === 'time') {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const inputType = mode === 'time' ? 'time' : 'date';

  return (
    <View style={{ width: '100%' }}>
      <input
        type={inputType}
        value={formatDateForInput(value)}
        onChange={handleChange}
        min={minimumDate ? formatDateForInput(minimumDate) : undefined}
        max={maximumDate ? formatDateForInput(maximumDate) : undefined}
        style={{
          padding: '12px',
          fontSize: '16px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#ffffff',
          width: '100%',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxSizing: 'border-box',
        }}
      />
    </View>
  );
}

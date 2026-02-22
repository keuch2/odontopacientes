import { View, Text } from 'react-native'

export default function MinimalApp() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#10b981' }}>
      <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'white' }}>✓ App Funciona</Text>
    </View>
  )
}

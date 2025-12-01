import { View, useColorScheme } from 'react-native'

export default function Index() {
  const colorScheme = useColorScheme()
  
  // Color adaptativo según el tema del sistema
  const backgroundColor = colorScheme === 'dark' ? '#000000' : '#FFFFFF'

  return <View style={{ flex: 1, backgroundColor }} />
}
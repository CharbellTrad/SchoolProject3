import { Alert, Platform, } from 'react-native';

export const showAlert = (title: string, message: string, buttons?: any[]) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const result = window.confirm(`${title}\n\n${message}`);
      if (result && buttons[1].onPress) {
        buttons[1].onPress();
      } else if (!result && buttons[0].onPress) {
        buttons[0].onPress();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
      if (buttons && buttons[0].onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};
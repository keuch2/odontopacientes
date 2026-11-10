import * as ImagePicker from 'expo-image-picker'

/**
 * Opciones para fotos clínicas: iOS entrega JPEG en lugar de HEIC, que el servidor
 * no puede procesar, y se limita el peso de cada subida en base64.
 */
export const PHOTO_PICKER_OPTIONS = {
  preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  quality: 0.6,
  selectionLimit: 5,
}

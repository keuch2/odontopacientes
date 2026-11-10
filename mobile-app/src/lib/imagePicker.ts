import * as ImagePicker from 'expo-image-picker'

/** Hace que iOS entregue JPEG en lugar de HEIC, que el servidor no puede procesar. */
export const COMPATIBLE_IMAGE_OPTIONS = {
  preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
}

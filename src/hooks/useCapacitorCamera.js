import { Camera } from '@capacitor/camera';
import { CameraResultType, CameraSource } from '@capacitor/camera';

export const useCapacitorCamera = () => {
  const takePhoto = async (source = CameraSource.Camera) => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source,
        width: 1280,
        height: 720,
      });
      return image.dataUrl;
    } catch (error) {
      console.error('Camera error:', error);
      throw error;
    }
  };

  const pickFromGallery = async () => {
    return takePhoto(CameraSource.Photos);
  };

  const takePhotoWithCamera = async () => {
    return takePhoto(CameraSource.Camera);
  };

  return {
    takePhoto,
    pickFromGallery,
    takePhotoWithCamera
  };
};

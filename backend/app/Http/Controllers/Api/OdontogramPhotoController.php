<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OdontogramPhoto;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class OdontogramPhotoController extends Controller
{
    /**
     * Listar fotos del odontograma de un paciente
     */
    public function index(Patient $patient)
    {
        $photos = OdontogramPhoto::where('patient_id', $patient->id)
            ->with('createdBy')
            ->orderBy('taken_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $photos->map(function ($photo) {
                return $this->formatPhoto($photo);
            })
        ]);
    }

    /**
     * Subir foto en base64
     */
    public function storeBase64(Request $request, Patient $patient)
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|string',
            'description' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->attributes->get('demo_user');
        if (!$user) {
            return response()->json(['message' => 'Usuario no autenticado'], 401);
        }

        try {
            $imageData = $request->input('image');

            if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $matches)) {
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
            }

            $imageData = base64_decode($imageData);

            if ($imageData === false) {
                return response()->json(['message' => 'Imagen inválida'], 400);
            }

            $processedImage = $this->processImageFromString($imageData);

            $fileName = Str::uuid() . '.jpg';
            $directory = 'odontogram/' . $patient->id;
            Storage::disk('public')->makeDirectory($directory);

            $path = $directory . '/' . $fileName;
            Storage::disk('public')->put($path, $processedImage['data']);

            $photo = OdontogramPhoto::create([
                'patient_id' => $patient->id,
                'file_path' => $path,
                'file_name' => 'odontogram_' . time() . '.jpg',
                'mime_type' => 'image/jpeg',
                'size' => $processedImage['size'],
                'description' => $request->description,
                'taken_at' => now(),
                'created_by' => $user['id'],
            ]);

            $photo->load('createdBy');

            return response()->json([
                'message' => 'Foto subida exitosamente',
                'data' => $this->formatPhoto($photo),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al subir la foto',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar descripción de foto
     */
    public function update(Request $request, OdontogramPhoto $odontogramPhoto)
    {
        $validator = Validator::make($request->all(), [
            'description' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->attributes->get('demo_user');
        if (!$user) {
            return response()->json(['message' => 'Usuario no autenticado'], 401);
        }

        // Solo el creador puede editar
        if ($odontogramPhoto->created_by != $user['id']) {
            return response()->json([
                'message' => 'No tienes permiso para editar esta foto'
            ], 403);
        }

        $odontogramPhoto->update($request->only(['description']));
        $odontogramPhoto->load('createdBy');

        return response()->json([
            'message' => 'Foto actualizada exitosamente',
            'data' => $this->formatPhoto($odontogramPhoto),
        ]);
    }

    /**
     * Eliminar foto
     */
    public function destroy(Request $request, OdontogramPhoto $odontogramPhoto)
    {
        $user = $request->attributes->get('demo_user');
        if (!$user) {
            return response()->json(['message' => 'Usuario no autenticado'], 401);
        }

        // Solo el creador puede eliminar
        if ($odontogramPhoto->created_by != $user['id']) {
            return response()->json([
                'message' => 'No tienes permiso para eliminar esta foto'
            ], 403);
        }

        $odontogramPhoto->delete();

        return response()->json([
            'message' => 'Foto eliminada exitosamente'
        ]);
    }

    private function formatPhoto(OdontogramPhoto $photo): array
    {
        return [
            'id' => $photo->id,
            'url' => $photo->full_url,
            'file_name' => $photo->file_name,
            'mime_type' => $photo->mime_type,
            'size' => $photo->size,
            'formatted_size' => $photo->formatted_size,
            'description' => $photo->description,
            'taken_at' => $photo->taken_at?->toIso8601String(),
            'created_by' => $photo->createdBy ? [
                'id' => $photo->createdBy->id,
                'name' => $photo->createdBy->name,
            ] : null,
            'created_at' => $photo->created_at?->toIso8601String(),
        ];
    }

    private function processImageFromString(string $imageString): array
    {
        $maxWidth = 1200;
        $maxHeight = 1200;
        $quality = 80;

        $sourceImage = imagecreatefromstring($imageString);

        if (!$sourceImage) {
            throw new \Exception('No se pudo procesar la imagen');
        }

        $width = imagesx($sourceImage);
        $height = imagesy($sourceImage);

        $ratio = min($maxWidth / $width, $maxHeight / $height, 1);
        $newWidth = (int) ($width * $ratio);
        $newHeight = (int) ($height * $ratio);

        $newImage = imagecreatetruecolor($newWidth, $newHeight);
        imagecopyresampled($newImage, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        ob_start();
        imagejpeg($newImage, null, $quality);
        $imageData = ob_get_clean();

        imagedestroy($sourceImage);
        imagedestroy($newImage);

        return [
            'data' => $imageData,
            'size' => strlen($imageData),
        ];
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\ProcedurePhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ProcedurePhotoController extends Controller
{
    /**
     * Listar fotos de una asignación
     */
    public function index(Assignment $assignment)
    {
        $photos = $assignment->photos()
            ->with('createdBy')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $photos->map(function ($photo) {
                return [
                    'id' => $photo->id,
                    'url' => $photo->full_url,
                    'file_name' => $photo->file_name,
                    'mime_type' => $photo->mime_type,
                    'size' => $photo->size,
                    'formatted_size' => $photo->formatted_size,
                    'description' => $photo->description,
                    'taken_at' => $photo->taken_at,
                    'created_by' => [
                        'id' => $photo->createdBy->id,
                        'name' => $photo->createdBy->name,
                    ],
                    'created_at' => $photo->created_at,
                ];
            })
        ]);
    }

    /**
     * Subir nueva foto (multipart/form-data)
     */
    public function store(Request $request, Assignment $assignment)
    {
        $validator = Validator::make($request->all(), [
            'photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:10240', // 10MB max
            'description' => 'nullable|string|max:500',
            'taken_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        // Obtener usuario del middleware demo.auth
        $user = $request->attributes->get('demo_user');
        if (!$user) {
            return response()->json(['message' => 'Usuario no autenticado'], 401);
        }

        // Verificar que el usuario sea el dueño de la asignación
        if ($assignment->student_id != $user['id']) {
            return response()->json([
                'message' => 'No tienes permiso para subir fotos a esta asignación'
            ], 403);
        }

        try {
            $file = $request->file('photo');
            
            // Procesar y redimensionar imagen
            $processedImage = $this->processImage($file);
            
            // Generar nombre único
            $fileName = Str::uuid() . '.jpg';
            
            // Crear directorio si no existe
            $directory = 'procedures/' . $assignment->id;
            Storage::disk('public')->makeDirectory($directory);
            
            // Guardar imagen procesada
            $path = $directory . '/' . $fileName;
            Storage::disk('public')->put($path, $processedImage['data']);

            // Crear registro en base de datos
            $photo = ProcedurePhoto::create([
                'assignment_id' => $assignment->id,
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'mime_type' => 'image/jpeg',
                'size' => $processedImage['size'],
                'description' => $request->description,
                'taken_at' => $request->taken_at ?? now(),
                'created_by' => $user['id'],
            ]);

            return response()->json([
                'message' => 'Foto subida exitosamente',
                'data' => [
                    'id' => $photo->id,
                    'url' => $photo->full_url,
                    'file_name' => $photo->file_name,
                    'size' => $photo->size,
                    'formatted_size' => $photo->formatted_size,
                    'description' => $photo->description,
                    'created_at' => $photo->created_at,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al subir la foto',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Subir foto en base64 (para móvil)
     */
    public function storeBase64(Request $request, Assignment $assignment)
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|string',
            'description' => 'nullable|string|max:500',
            'taken_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        // Obtener usuario del middleware demo.auth
        $user = $request->attributes->get('demo_user');
        if (!$user) {
            return response()->json(['message' => 'Usuario no autenticado'], 401);
        }

        // Verificar que el usuario sea el dueño de la asignación
        if ($assignment->student_id != $user['id']) {
            return response()->json([
                'message' => 'No tienes permiso para subir fotos a esta asignación'
            ], 403);
        }

        try {
            $imageData = $request->input('image');
            
            // Remover prefijo data:image/...;base64, si existe
            if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $matches)) {
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
            }
            
            $imageData = base64_decode($imageData);
            
            if ($imageData === false) {
                return response()->json(['message' => 'Imagen inválida'], 400);
            }
            
            // Procesar y redimensionar imagen
            $processedImage = $this->processImageFromString($imageData);
            
            // Generar nombre único
            $fileName = Str::uuid() . '.jpg';
            
            // Crear directorio si no existe
            $directory = 'procedures/' . $assignment->id;
            Storage::disk('public')->makeDirectory($directory);
            
            // Guardar imagen procesada
            $path = $directory . '/' . $fileName;
            Storage::disk('public')->put($path, $processedImage['data']);

            // Crear registro en base de datos
            $photo = ProcedurePhoto::create([
                'assignment_id' => $assignment->id,
                'file_path' => $path,
                'file_name' => 'photo_' . time() . '.jpg',
                'mime_type' => 'image/jpeg',
                'size' => $processedImage['size'],
                'description' => $request->description,
                'taken_at' => $request->taken_at ?? now(),
                'created_by' => $user['id'],
            ]);

            return response()->json([
                'message' => 'Foto subida exitosamente',
                'data' => [
                    'id' => $photo->id,
                    'url' => $photo->full_url,
                    'file_name' => $photo->file_name,
                    'size' => $photo->size,
                    'formatted_size' => $photo->formatted_size,
                    'description' => $photo->description,
                    'created_at' => $photo->created_at,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al subir la foto',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Procesar imagen desde archivo subido
     */
    private function processImage($file): array
    {
        $maxWidth = 1200;
        $maxHeight = 1200;
        $quality = 80;

        // Crear imagen desde archivo
        $sourceImage = imagecreatefromstring(file_get_contents($file->getPathname()));
        
        if (!$sourceImage) {
            throw new \Exception('No se pudo procesar la imagen');
        }

        $width = imagesx($sourceImage);
        $height = imagesy($sourceImage);

        // Calcular nuevas dimensiones manteniendo proporción
        $ratio = min($maxWidth / $width, $maxHeight / $height, 1);
        $newWidth = (int) ($width * $ratio);
        $newHeight = (int) ($height * $ratio);

        // Crear nueva imagen redimensionada
        $newImage = imagecreatetruecolor($newWidth, $newHeight);
        imagecopyresampled($newImage, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        // Capturar output como JPEG
        ob_start();
        imagejpeg($newImage, null, $quality);
        $imageData = ob_get_clean();

        // Liberar memoria
        imagedestroy($sourceImage);
        imagedestroy($newImage);

        return [
            'data' => $imageData,
            'size' => strlen($imageData),
        ];
    }

    /**
     * Procesar imagen desde string (base64 decodificado)
     */
    private function processImageFromString(string $imageString): array
    {
        $maxWidth = 1200;
        $maxHeight = 1200;
        $quality = 80;

        // Crear imagen desde string
        $sourceImage = imagecreatefromstring($imageString);
        
        if (!$sourceImage) {
            throw new \Exception('No se pudo procesar la imagen');
        }

        $width = imagesx($sourceImage);
        $height = imagesy($sourceImage);

        // Calcular nuevas dimensiones manteniendo proporción
        $ratio = min($maxWidth / $width, $maxHeight / $height, 1);
        $newWidth = (int) ($width * $ratio);
        $newHeight = (int) ($height * $ratio);

        // Crear nueva imagen redimensionada
        $newImage = imagecreatetruecolor($newWidth, $newHeight);
        imagecopyresampled($newImage, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        // Capturar output como JPEG
        ob_start();
        imagejpeg($newImage, null, $quality);
        $imageData = ob_get_clean();

        // Liberar memoria
        imagedestroy($sourceImage);
        imagedestroy($newImage);

        return [
            'data' => $imageData,
            'size' => strlen($imageData),
        ];
    }

    /**
     * Actualizar descripción de foto
     */
    public function update(Request $request, ProcedurePhoto $procedurePhoto)
    {
        $validator = Validator::make($request->all(), [
            'description' => 'nullable|string|max:500',
            'taken_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        // Obtener usuario del middleware demo.auth
        $user = $request->attributes->get('demo_user');
        if (!$user) {
            return response()->json(['message' => 'Usuario no autenticado'], 401);
        }

        // Verificar permisos
        if ($procedurePhoto->assignment->student_id != $user['id']) {
            return response()->json([
                'message' => 'No tienes permiso para editar esta foto'
            ], 403);
        }

        $procedurePhoto->update($request->only(['description', 'taken_at']));

        return response()->json([
            'message' => 'Foto actualizada exitosamente',
            'data' => [
                'id' => $procedurePhoto->id,
                'url' => $procedurePhoto->full_url,
                'description' => $procedurePhoto->description,
                'taken_at' => $procedurePhoto->taken_at,
            ]
        ]);
    }

    /**
     * Eliminar foto
     */
    public function destroy(Request $request, ProcedurePhoto $procedurePhoto)
    {
        // Obtener usuario del middleware demo.auth
        $user = $request->attributes->get('demo_user');
        if (!$user) {
            return response()->json(['message' => 'Usuario no autenticado'], 401);
        }

        // Verificar permisos
        if ($procedurePhoto->assignment->student_id != $user['id']) {
            return response()->json([
                'message' => 'No tienes permiso para eliminar esta foto'
            ], 403);
        }

        // Eliminar archivo y registro (el modelo se encarga de eliminar el archivo)
        $procedurePhoto->delete();

        return response()->json([
            'message' => 'Foto eliminada exitosamente'
        ]);
    }
}

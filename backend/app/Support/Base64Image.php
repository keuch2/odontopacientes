<?php

namespace App\Support;

class Base64Image
{
    public const UNSUPPORTED_MESSAGE = 'Formato de imagen no admitido. Usa JPEG, PNG o WebP.';

    public static function isSupported(string $imageData): bool
    {
        $info = @getimagesizefromstring($imageData);

        return $info !== false
            && in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true);
    }
}

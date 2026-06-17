import {
  BadRequestException,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { InternalApiKeyGuard } from '../common/internal-api-key.guard';
import { S3StorageService } from '../s3-storage/s3-storage.service';

@UseGuards(InternalApiKeyGuard)
@Controller('internal/media')
export class MediaController {
  constructor(private readonly s3StorageService: S3StorageService) {}

  @Post('camera-previews/:cameraId/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_request, file, callback) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          callback(
            new BadRequestException(
              'Only jpeg, png and webp images are allowed',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadCameraPreview(
    @Param('cameraId', new ParseUUIDPipe({ version: '4' }))
    cameraId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.s3StorageService.uploadCameraPreviewFile({
      cameraId,
      file,
    });
  }
}
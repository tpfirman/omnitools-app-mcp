import { z } from 'zod';
import { extname } from 'path';
import type { ToolDefinition } from './types.js';
import { ensureAllowedPath, ensureFileSizeWithinLimit, runCommandWithTimeout } from './utils.js';

const videoMetadataSchema = z.object({ filePath: z.string() });
const extractAudioSchema = z.object({
  inputPath: z.string(),
  outputPath: z.string(),
  format: z.enum(['mp3', 'wav', 'aac']).default('mp3'),
});

export const mediaTools: ToolDefinition[] = [
  {
    name: 'media_video_metadata',
    description: 'Get video/audio stream metadata using ffprobe',
    category: 'media',
    tags: ['media', 'video', 'metadata', 'ffprobe'],
    schema: videoMetadataSchema,
    execute: async (input, context) => {
      try {
        const { filePath } = videoMetadataSchema.parse(input);
        const safePath = await ensureAllowedPath(filePath, context);
        await ensureFileSizeWithinLimit(safePath, context.config.maxFileSize);

        const ffprobePath = context.config.ffmpegPath?.replace(/ffmpeg$/, 'ffprobe') ?? 'ffprobe';
        const { stdout } = await runCommandWithTimeout(
          ffprobePath,
          ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', safePath],
          context.config.toolTimeout
        );

        return {
          success: true,
          data: JSON.parse(stdout),
          message: 'Retrieved media metadata',
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to read media metadata: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  },
  {
    name: 'media_extract_audio',
    description: 'Extract audio track from a video file using ffmpeg',
    category: 'media',
    tags: ['media', 'audio', 'extract', 'ffmpeg'],
    schema: extractAudioSchema,
    execute: async (input, context) => {
      try {
        const { inputPath, outputPath, format } = extractAudioSchema.parse(input);
        const safeInputPath = await ensureAllowedPath(inputPath, context);
        const safeOutputPath = await ensureAllowedPath(outputPath, context);
        await ensureFileSizeWithinLimit(safeInputPath, context.config.maxFileSize);

        const outputExt = extname(safeOutputPath).replace('.', '').toLowerCase();
        if (outputExt && outputExt !== format) {
          return {
            success: false,
            message: `Output extension (.${outputExt}) does not match requested format (${format})`,
          };
        }

        const ffmpegPath = context.config.ffmpegPath ?? 'ffmpeg';
        await runCommandWithTimeout(
          ffmpegPath,
          ['-y', '-i', safeInputPath, '-vn', '-acodec', format, safeOutputPath],
          context.config.toolTimeout
        );

        return {
          success: true,
          data: { outputPath: safeOutputPath, format },
          message: 'Extracted audio successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to extract audio: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  },
];

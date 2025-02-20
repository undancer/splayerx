import { EventEmitter } from 'events';
import { IPlaylistRequest } from '@renderer/interfaces/IPlaylistRequest';
import MediaStorageService from '@renderer/services/storage/MediaStorageService';
import { filePathToUrl } from '@renderer/helpers/path';
import { info } from '@renderer/libs/DataBase';
import { MediaItem } from '@renderer/interfaces/IDB';
import { getSnapshotPath, getFormat } from '@renderer/plugins/mediaTasks';

interface IPlaylistEvent {
  'image-loaded': Event,
}
export default class PlaylistService extends EventEmitter implements IPlaylistRequest {
  public coverSrc: string;

  public duration: number;

  public record: MediaItem;

  public smallShortCut: string;

  public lastPlayedTime: number;

  public imageSrc: string | undefined;

  private mediaStorageService: MediaStorageService;

  public path: string;

  public videoId?: number;

  public get percentage(): number {
    if (this.lastPlayedTime
        && this.lastPlayedTime / this.duration <= 1) {
      return (this.lastPlayedTime / this.duration) * 100;
    }
    return 0;
  }

  public constructor(mediaStorageService: MediaStorageService, path: string, videoId?: number) {
    super();
    this.mediaStorageService = mediaStorageService;
    this.path = path;
    this.videoId = videoId;
    getFormat(path)
      .then(async (format) => {
        if (format && format.duration) {
          this.duration = format.duration;
          const randomNumber = Math.round((Math.random() * 20) + 5);
          const imgPath = await getSnapshotPath(
            path,
            randomNumber > this.duration ? this.duration : randomNumber,
          );
          this.imageSrc = filePathToUrl(`${imgPath}`);
          this.emit('image-loaded');
        }
      });
    this.getRecord(videoId);
  }

  public on<K extends keyof IPlaylistEvent>(type: K, listener: (...args: unknown[]) => void): this {
    return super.on(type, listener);
  }

  /**
   * @param  {string} mediaHash
   * @returns Promise 返回视频封面图片
   */
  public async getCover(mediaHash: string): Promise<string | null> {
    try {
      const result = await this.mediaStorageService.getImageBy(mediaHash, 'cover');
      return result;
    } catch (err) {
      return null;
    }
  }

  /**
   * @param  {number} videoId
   * @returns Promise 获取播放记录
   */
  public async getRecord(videoId?: number, record?: MediaItem): Promise<void> {
    if (record) {
      this.record = record;
      if (record.lastPlayedTime) {
        this.lastPlayedTime = record.lastPlayedTime;
        if (this.lastPlayedTime > 2) this.imageSrc = record.smallShortCut;
      }
      return;
    }
    if (videoId) {
      record = await info.getValueByKey('media-item', videoId);
    } else {
      const records = await info.getAllValueByIndex('media-item', 'source', '');
      // @ts-ignore
      record = records.find(record => record.path === this.path);
    }
    if (record) {
      this.record = record;
      if (record.lastPlayedTime) {
        this.lastPlayedTime = record.lastPlayedTime;
        if (this.lastPlayedTime > 5) this.imageSrc = record.smallShortCut;
      }
    }
  }
}

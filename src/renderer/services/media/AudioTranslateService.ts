/*
 * @Author: tanghaixiang@xindong.com
 * @Date: 2019-06-20 18:03:14
 * @Last Modified by: tanghaixiang@xindong.com
 * @Last Modified time: 2019-12-17 11:35:17
 */

// @ts-ignore
import { ipcRenderer, Event } from 'electron';
import { EventEmitter } from 'events';
import { isNaN } from 'lodash';
import { status } from '@grpc/grpc-js';
import {
  StreamingTranslationResponse,
} from 'sagi-api/translation/v1/translation_pb';
import { AITaskInfo } from '@renderer/interfaces/IMediaStorable';
import sagi from '@renderer/libs/sagi';
import { Stream } from '@renderer/plugins/mediaTasks/mediaInfoQueue';
import { isAccountEnabled } from '@shared/config';
import { getClientUUID } from '@shared/utils';
import { log } from '@renderer/libs/Log';
import { TranscriptInfo } from '../subtitle';
import MediaStorageService, { mediaStorageService } from '../storage/MediaStorageService';

type JobData = {
  audioId: string,
  audioInfo?: Stream,
  mediaHash: string,
  videoSrc: string,
  audioLanguageCode: string,
  targetLanguageCode: string,
}

declare interface AudioTranslateService { // eslint-disable-line
  on(event: 'grab', listener: (time: number) => void): this,
  on(event: 'grabCompleted', listener: () => void): this,
  on(event: 'error', listener: (error: Error) => void): this,
  on(event: 'task', listener: (taskInfo: AITaskInfo) => void): this,
  on(event: 'transcriptInfo', listener: (transcriptInfo: TranscriptInfo) => void): this,
  on(event: 'skip-audio', listener: () => void): this,
  on(event: 'grab-audio', listener: () => void): this,
}

class AudioTranslateService extends EventEmitter {
  public mediaHash: string;

  public videoSrc: string;

  public audioId: number;

  public audioLanguageCode: string;

  public targetLanguageCode: string;

  public streamClient: any; // eslint-disable-line

  public taskInfo?: AITaskInfo;

  public audioInfo?: Stream;

  public loopTimer: NodeJS.Timer;

  public timeoutTimer: NodeJS.Timer;

  private mediaStorageService: MediaStorageService;

  // loop task 3次超时 才算超时
  // 如果3次内正常收到，就重置
  private loopTimeoutCount: number;

  public constructor(mediaStorageService: MediaStorageService) {
    super();
    this.mediaStorageService = mediaStorageService;
    this.ipcCallBack = this.ipcCallBack.bind(this);
  }

  public ipcCallBack(event: Event, {
    time, end, error, result,
  }: {
    time?: Buffer, end?: boolean, error?: Error, result?: StreamingTranslationResponse.AsObject,
  }) {
    if (end) {
      this.emit('grabCompleted');
    } else if (result) {
      log.debug('audiotranslate', result);
      this.handleMainCallBack(result);
    } else if (error) {
      this.emit('error', error);
      this.stop();
    } else if (time) {
      this.emit('grab', time);
    }
  }

  public stop() {
    this.removeAllListeners();
    this.clearJob();
    ipcRenderer.send('grab-audio-stop');
  }

  public startJob(data: JobData): AudioTranslateService {
    // 计算audioID
    const audioId = Number(data.audioId) - 1;
    this.audioId = isNaN(audioId) ? -1 : audioId;
    // 保存本次任务信息
    this.mediaHash = data.mediaHash;
    this.videoSrc = data.videoSrc;
    this.audioLanguageCode = data.audioLanguageCode;
    this.targetLanguageCode = data.targetLanguageCode;
    this.audioInfo = data.audioInfo;
    getClientUUID().then((uuid: string) => {
      ipcRenderer.send('grab-audio', {
        mediaHash: this.mediaHash,
        videoSrc: this.videoSrc,
        audioLanguageCode: this.audioLanguageCode,
        targetLanguageCode: this.targetLanguageCode,
        audioId: this.audioId,
        audioInfo: this.audioInfo,
        uuid,
        agent: navigator.userAgent,
      });
    });
    ipcRenderer.removeListener('grab-audio-update', this.ipcCallBack);
    ipcRenderer.on('grab-audio-update', this.ipcCallBack);
    return this;
  }

  private async handleMainCallBack( // eslint-disable-line complexity
    result: StreamingTranslationResponse.AsObject,
  ) {
    const enabled = await isAccountEnabled();
    if (result && result.taskinfo) {
      this.taskInfo = {
        mediaHash: this.mediaHash,
        audioLanguageCode: this.audioLanguageCode,
        targetLanguage: this.targetLanguageCode,
        ...result.taskinfo,
      };
      this.emit('task', this.taskInfo);
      this.emit('skip-audio');
      this.loopTask(this.taskInfo);
    } else if (result && result.transcriptResult) {
      // get Transcript Info
      // return hash to render
      this.emit('transcriptInfo', result.transcriptResult);
      this.emit('skip-audio');
      this.clearJob();
    } else if (result && result.error && result.error.code === 9100) {
      this.emit('grab-audio');
      ipcRenderer.send('grab-audio-continue');
    } else if (enabled && result && result.error
      && result.error.code === status.UNAUTHENTICATED) {
      // return forbidden to render
      this.emit('error', new Error('forbidden'));
      this.stop();
    } else if (enabled && result && result.error
      && result.error.code === status.PERMISSION_DENIED) {
      // return no permission to render
      this.emit('error', new Error('permission'));
      this.stop();
    } else if (enabled && result && result.error
      && result.error.code === status.ALREADY_EXISTS) {
      // return no permission to render
      this.emit('error', new Error('already_exists'));
      this.stop();
    } else if (enabled && result && result.error
      && result.error.code === status.RESOURCE_EXHAUSTED) {
      // return no permission to render
      this.emit('error', new Error('resource_exhausted'));
      this.stop();
    } else if (result && result.error) {
      // return error to render
      this.emit('error', result.error);
      this.stop();
    }
  }

  private loopTask(taskInfo: AITaskInfo) {
    const taskId = taskInfo.taskId;
    let delay = Math.ceil((taskInfo.estimateTime / 2));
    // 延迟查询task进度，如果延迟超多10秒，就10秒之后去查询
    delay = delay > 10 ? 10 * 1000 : delay * 1000;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
    }
    this.loopTimer = setTimeout(async () => {
      try {
        const res = await sagi.streamingTranslationTask(taskId);
        const result = res && res.toObject();
        if (result && res.hasTranscriptinfo()) {
          this.emit('transcriptInfo', result.transcriptinfo);
          this.clearJob();
        } else if (result && res.hasTaskinfo() && result.taskinfo) {
          this.taskInfo = {
            audioLanguageCode: this.audioLanguageCode,
            targetLanguage: this.targetLanguageCode,
            mediaHash: this.mediaHash,
            ...result.taskinfo,
          };
          this.emit('task', this.taskInfo);
          // 3次超时内得到返回，重置超时次数
          this.loopTimeoutCount = 3;
          this.loopTask(this.taskInfo);
        } else if (result && res.hasError()) {
          this.emit('error', result.error);
          this.stop();
        }
      } catch (error) {
        if (error && error.message === 'time out' && this.loopTimeoutCount > 0 && this.taskInfo) {
          this.loopTimeoutCount -= 1;
          this.loopTask(this.taskInfo);
        } else {
          this.emit('error', error);
          this.stop();
        }
      }
    }, delay);
  }

  public clearJob() {
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
    }
  }

  public saveTask() {
    const { mediaHash } = this;
    if (this.taskInfo) {
      this.mediaStorageService.setAsyncTaskInfo(mediaHash, this.taskInfo);
    }
  }
}
export default AudioTranslateService;

export const audioTranslateService = new AudioTranslateService(mediaStorageService);

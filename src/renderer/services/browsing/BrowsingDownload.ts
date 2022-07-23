import electron from 'electron';
// @ts-ignore
import youtubedl from 'youtube-dl';
import fs from 'fs';
import url from 'url';
import Path from 'path';
import http from 'http';
import request from 'request';
// @ts-ignore
import progress from 'request-progress';
// @ts-ignore
import streamify from 'streamify';
import { log } from '@/libs/Log';
import { IBrowsingDownload } from '@/interfaces/IBrowsingDownload';

class BrowsingDownload implements IBrowsingDownload {
  private url: string;

  private id: string;

  private downloadId: string;

  private progress: number;

  private initProgress: number;

  private size: number;

  private path: string;

  private name: string;

  private req: request.Request | null;

  private paused: boolean;

  private lastProgress: number;

  private manualAbort: boolean;

  public constructor(url: string, id?: string, downloadId?: string) {
    this.url = url;
    this.paused = false;
    this.id = id || '';
    this.downloadId = downloadId || '';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async getDownloadVideo(Cookie: string): Promise<any> {
    const options = Cookie ? ['--add-header', `Cookie:"${Cookie}"`] : [];
    return new Promise(((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      youtubedl.getInfo(this.url, options, (err: any, info: any) => {
        if (err) reject(err);
        resolve({ info, url: this.url });
      });
    }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public startDownload(id: string, name: string, path: string, headers: any): void {
    this.progress = 0;
    this.initProgress = 0;
    this.lastProgress = 0;
    const options = headers.Cookie ? ['--add-header', `Cookie:"${headers.Cookie}"`] : [];
    const stream = streamify({
      superCtor: http.ServerResponse,
      readable: true,
      writable: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    youtubedl.getInfo(this.url, options.concat(['-f', id]), (err: any, data: any) => (err || this.manualAbort ? stream.emit('error', err || 'manual abort') : this.processData(data, stream, headers)));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stream.on('info', (info: any) => {
      this.size = info.size + this.initProgress;
      electron.ipcRenderer.send('transfer-download-info', {
        id: this.id, downloadId: this.downloadId, url: this.url, name, path, size: this.size,
      });
      this.path = path;
      this.name = name;
      stream.pipe(fs.createWriteStream(Path.join(path, name)));
    });
    stream.on('data', (chunk: Buffer) => {
      if (!fs.existsSync(Path.join(this.path, this.name))) {
        log.error('file not found', Path.join(this.path, this.name));
        this.abort();
        this.req = null;
        electron.ipcRenderer.sendTo(electron.remote.getCurrentWindow().webContents.id, 'file-not-found', this.id);
      }
      this.progress += chunk.length;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stream.on('error', (e: any) => {
      electron.ipcRenderer.send('start-download-error');
      log.error('download video error', e.message || e);
      this.req = null;
    });
    stream.on('end', () => {
      if (this.progress >= this.size) {
        electron.ipcRenderer.send('transfer-progress', { id: this.id, pos: this.size, speed: 0 });
        electron.ipcRenderer.send('show-notification', { name: this.name, path: this.path });
        log.info('download complete', path);
      }
      this.req = null;
    });
  }

  public pause() {
    if (this.req) {
      this.req.pause();
      this.paused = true;
    }
  }

  public resume() {
    if (this.req) {
      this.req.resume();
      this.paused = false;
    }
  }

  public abort() {
    if (this.req) {
      this.req.abort();
    }
  }

  public getId() {
    return this.id;
  }

  public getDownloadId() {
    return this.downloadId;
  }

  public getProgress(): number {
    return this.progress;
  }

  public getSize(): number {
    return this.size;
  }

  public getUrl(): string {
    return this.url;
  }

  public getName(): string {
    return this.name;
  }

  public getPath(): string {
    return this.path;
  }

  public killProcess(): void {
    this.manualAbort = true;
    this.abort();
  }

  public continueDownload(id: string, name: string, path: string, lastIndex: number): void {
    this.initProgress = lastIndex;
    this.progress = lastIndex;
    this.lastProgress = lastIndex;
    const stream = streamify({
      superCtor: http.ServerResponse,
      readable: true,
      writable: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    youtubedl.getInfo(this.url, ['-f', id], (err: any, data: any) => (err ? stream.emit('error', err) : this.processData(data, stream, {}, { start: lastIndex })));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stream.on('info', (info: any) => {
      this.size = info.size + this.initProgress;
      this.path = path;
      this.name = name;
      stream.pipe(fs.createWriteStream(Path.join(path, name), { flags: 'a' }));
    });
    stream.on('data', (chunk: Buffer) => {
      if (!fs.existsSync(Path.join(this.path, this.name))) {
        log.error('file not found', Path.join(this.path, this.name));
        this.abort();
        this.req = null;
        electron.ipcRenderer.sendTo(electron.remote.getCurrentWindow().webContents.id, 'file-not-found', this.id);
      }
      this.progress += chunk.length;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stream.on('error', (e: any) => {
      electron.ipcRenderer.send('downloading-network-error', this.id);
      log.error('download video error', e.message);
      this.req = null;
    });
    stream.on('end', () => {
      if (this.progress >= this.size) {
        electron.ipcRenderer.send('transfer-progress', { id: this.id, pos: this.size, speed: 0 });
        electron.ipcRenderer.send('show-notification', { name: this.name, path: this.path });
        log.info('download complete', path);
      }
      this.req = null;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private processData(data: any, stream: any, reqHeaders: any, options?: { start: number }) {
    const item = !data.length ? data : data.shift();
    // fix for pause/resume downloads
    const headers = Object.assign(
      reqHeaders,
      { Host: url.parse(item.url).hostname },
      data.http_headers,
    );

    if (options && options.start > 0) {
      headers.Range = `bytes=${options.start}-`;
    }
    this.req = progress(request({
      url: item.url,
      headers,
    }));
    (this.req as request.Request).on('progress', () => {
      if (!this.paused) {
        const speed = this.progress - this.lastProgress;
        this.lastProgress = this.progress;
        electron.ipcRenderer.send('transfer-progress', { id: this.id, pos: this.progress, speed });
      }
    });
    // eslint-disable-next-line consistent-return
    (this.req as request.Request).on('response', (res: http.IncomingMessage) => {
      const size = parseInt((res.headers['content-length'] as string), 10);
      if (size) item.size = size;

      if (options && options.start > 0 && res.statusCode === 416) {
        // the file that is being resumed is complete.
        return stream.emit('complete', item);
      }

      if (res.statusCode !== 200 && res.statusCode !== 206) {
        return stream.emit('error', new Error(`status code ${res.statusCode}`));
      }

      stream.emit('info', item);

      stream.on('end', () => {
        if (data.length) stream.emit('next', data);
      });
    });
    (this.req as request.Request).on('error', (err) => {
      electron.ipcRenderer.send('downloading-network-error', this.id);
      stream.emit('error', err);
    });
    return stream.resolve(this.req);
  }
}

export default BrowsingDownload;

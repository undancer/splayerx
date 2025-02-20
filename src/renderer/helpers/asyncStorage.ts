import path from 'path';
// @ts-ignore
import storage from 'electron-json-storage';
// @ts-ignore
import { promises as fsPromises } from 'fs';
import { log } from '@renderer/libs/Log';
import { addBubble } from '@renderer/helpers/notificationControl';

/*
  使用说明：
    在需要使用的组件中
    import asyncStorage from '@renderer/helpers/asyncStorage';
*/
function removeAll(): Promise<void[]> {
  const dirPath = storage.getDataPath();
  const taskArray: Promise<void>[] = [];
  return fsPromises.readdir(dirPath).then((files: string[]) => {
    files.forEach((file) => {
      taskArray.push(new Promise((resolve) => {
        storage.remove(path.basename(file), () => {
          resolve();
        });
      }));
    });
    return Promise.all(taskArray);
  });
}
function get(key: string): Promise<any> { // eslint-disable-line
  return new Promise((resolve, reject) => {
    storage.get(key, (err, data: unknown) => {
      if (err) {
        log.warn('asyncStorage', err);
        addBubble(err['code']);
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
function set(key: string, json: unknown) {
  return new Promise<void>((resolve, reject) => {
    storage.set(key, json, (err) => {
      if (err) {
        log.warn('asyncStorage', err);
        addBubble(err['code']);
        reject(err);
      }
      resolve();
    });
  });
}

export default {
  set,
  get,
  removeAll,
};

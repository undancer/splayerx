import { basename, extname } from 'path';
import { IRecentPlay, ILandingViewDisplayInfo, IMenuDisplayInfo } from '@renderer/interfaces/IRecentPlay';
import { mediaStorageService } from '@renderer/services/storage/MediaStorageService';
import { playInfoStorageService } from '@renderer/services/storage/PlayInfoStorageService';
import { info } from '@renderer/libs/DataBase';
import { mediaQuickHash } from '@renderer/libs/utils';
import { filePathToUrl } from '@renderer/helpers/path';

type coverViedoItem = {
  lastPlayedTime: number,
  duration: number,
  path: string,
  playedIndex: number,
  playlistLength: number,
  shortCut: string,
  id: number,
};

export default class RecentPlayService implements IRecentPlay {
  public async getRecords(): Promise<ILandingViewDisplayInfo[]> {
    const recentPlayedResults = await playInfoStorageService.getAllRecentPlayed();
    const coverVideos = (await Promise.all(
      recentPlayedResults.map(async (value) => {
        const { items, id } = value;
        let { playedIndex } = value;
        if (playedIndex > items.length || playedIndex < 0) {
          console.error('Wrong playedIndex');
          if (items.length >= 0) {
            playedIndex = 0;
            await playInfoStorageService.updateRecentPlayedBy(id, {
              ...value,
              playedIndex,
            });
          }
        }
        if (!items[playedIndex]) console.error('Cover video non-existed');
        const coverVideoId = items[playedIndex] as number;
        if (!coverVideoId) return null;
        const mediaItem = await info.getValueByKey('media-item', coverVideoId);
        if (!mediaItem) return null; // TODO: figure out why it wasn't saved to media-item

        return {
          ...mediaItem,
          id,
          playedIndex,
          playlistLength: items.length,
        };
      }),
    )).filter(item => !!item);
    const getBasename = (path: string) => basename(path, extname(path));
    const results: ILandingViewDisplayInfo[] = await Promise.all(
      coverVideos.map(async (item: coverViedoItem): Promise<ILandingViewDisplayInfo> => {
        const {
          lastPlayedTime, duration, path, playedIndex, playlistLength, shortCut, id,
        } = item;
        const percentage = (lastPlayedTime / duration) * 100;
        let backgroundUrl;

        if (duration - lastPlayedTime < 5 || lastPlayedTime < 2) {
          try {
            const mediaHash = await mediaQuickHash(path);
            const coverSrc = await mediaStorageService.getImageBy(mediaHash, 'cover');
            if (!coverSrc) throw new Error('Cannot get coverSrc');
            backgroundUrl = `url("${filePathToUrl(coverSrc as string)}")`;
          } catch (ex) {
            backgroundUrl = `url("${shortCut}")`;
          }
        } else {
          backgroundUrl = `url("${shortCut}")`;
        }

        const basename = getBasename(item.path);
        return {
          id,
          basename,
          lastPlayedTime,
          duration,
          percentage,
          path,
          backgroundUrl,
          playedIndex,
          playlistLength,
        };
      }),
    );
    return results;
  }

  public async getMenuDisplayInfo(): Promise<IMenuDisplayInfo[]> {
    const results = (await this.getRecords())
      .map(({ id, path }: ILandingViewDisplayInfo) => ({ id, label: path }));
    return results.splice(0, 9);
  }
}

export const recentPlayService = new RecentPlayService();

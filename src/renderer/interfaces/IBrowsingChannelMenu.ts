import { channelDetails } from '@renderer/interfaces/IBrowsingChannelManager';

export interface IBrowsingChannelMenu {
  getChannelMenu(): Electron.Menu,
  createChannelMenu(channel: string): void,
  createCustomizedMenu(channel: string, item: channelDetails): void,
  createTemporaryChannelMenu(channel: string, item: channelDetails,
    gettingTemporaryViewInfo: boolean): void,
}

import { shell, remote } from 'electron';
import { basename } from 'path';
import store from '@renderer/stores/vuex';
import {
  FILE_NON_EXIST_IN_PLAYLIST,
  PLAYLIST_NON_EXIST,
  FILE_NON_EXIST,
  EMPTY_FOLDER,
  OPEN_FAILED,
  ONLINE_LOADING,
  NOT_SUPPORTED_SUBTITLE,
  REQUEST_TIMEOUT,
  SUBTITLE_OFFLINE,
  SUBTITLE_UPLOAD,
  UPLOAD_SUCCESS,
  UPLOAD_FAILED,
  CANNOT_UPLOAD,
  ADD_NO_VIDEO,
  LOCAL_SUBTITLE_REMOVED,
  SNAPSHOT_SUCCESS,
  SNAPSHOT_FAILED,
  LOAD_SUBVIDEO_FAILED,
  ENOSPC,
  EACCES,
  EPERM,
  ENOENT,
  TRANSLATE_NO_LINE,
  TRANSLATE_SERVER_ERROR_FAIL,
  TRANSLATE_REQUEST_TIMEOUT,
  TRANSLATE_REQUEST_FORBIDDEN,
  TRANSLATE_REQUEST_PERMISSION,
  TRANSLATE_REQUEST_ALREADY_EXISTS,
  TRANSLATE_REQUEST_RESOURCE_EXHAUSTED,
  TRANSLATE_REQUEST_PERMISSION_APPX,
  TRANSLATE_SUCCESS,
  TRANSLATE_SUCCESS_WHEN_VIDEO_CHANGE,
  CHECK_FOR_UPDATES_OFFLINE,
  THUMBNAIL_GENERATE,
  THUMBNAIL_GENERATE_FAILED,
  THUMBNAIL_GENERATE_SUCCESS,
  CANNOT_EXPORT,
  SUBTITLE_EDITOR_SAVED,
  SUBTITLE_EDITOR_REFERENCE_LOADING,
  SUBTITLE_EDITOR_REFERENCE_LOAD_FAIL,
  BUG_UPLOAD_FAILED,
  BUG_UPLOAD_SUCCESS,
  BUG_UPLOADING,
  APPX_EXPORT_NOT_WORK,
  LOSSLESS_STREAMING_START,
  LOSSLESS_STREAMING_STOP,
} from './notificationcodes';

function showItemInFolderHandler(path) {
  return () => {
    if (path) shell.showItemInFolder(path);
  };
}

export function addBubble(code, options = {}) { // eslint-disable-line complexity
  const i18n = store.$i18n;
  if (!i18n) return;

  const { id } = options;

  switch (code) {
    case FILE_NON_EXIST_IN_PLAYLIST:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('errorFile.fileNonExistInPlaylist.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.fileNonExistInPlaylist.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case PLAYLIST_NON_EXIST:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('errorFile.playlistNonExist.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.playlistNonExist.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case FILE_NON_EXIST:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('errorFile.playlistNonExist.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.playlistNonExist.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case ADD_NO_VIDEO:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('errorFile.addNoVideo.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.addNoVideo.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case EMPTY_FOLDER:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('errorFile.emptyFolder.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.emptyFolder.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case OPEN_FAILED:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('errorFile.default.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.default.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case ONLINE_LOADING:
      store.dispatch('addMessages', {
        id,
        type: 'state',
        title: '',
        content: i18n.t('loading.content', i18n.locale, i18n.messages),
        dismissAfter: 2000,
      });
      break;
    case SUBTITLE_OFFLINE:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('errorFile.offLine.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.offLine.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case CHECK_FOR_UPDATES_OFFLINE:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('errorFile.offLine.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.offLine.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case NOT_SUPPORTED_SUBTITLE:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('errorFile.loadFailed.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.loadFailed.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case REQUEST_TIMEOUT:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('errorFile.timeout.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.timeout.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case SUBTITLE_UPLOAD:
      store.dispatch('addMessages', {
        id,
        type: 'state',
        title: '',
        content: i18n.t('uploading.content', i18n.locale, i18n.messages),
        dismissAfter: 2000,
      });
      break;
    case UPLOAD_SUCCESS:
      store.dispatch('addMessages', {
        id,
        type: 'state',
        title: '',
        content: i18n.t('uploadingSuccess.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case UPLOAD_FAILED:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('uploadingFailed.title', i18n.locale, i18n.messages),
        content: i18n.t('uploadingFailed.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case CANNOT_UPLOAD:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('cannotUpload.title', i18n.locale, i18n.messages),
        content: i18n.t('cannotUpload.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case CANNOT_EXPORT:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('cannotExport.title', i18n.locale, i18n.messages),
        content: i18n.t('cannotExport.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case LOCAL_SUBTITLE_REMOVED:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('errorFile.localSubtitleRemoved.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.localSubtitleRemoved.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case SNAPSHOT_SUCCESS:
      store.dispatch('addMessages', {
        id,
        type: 'resolved',
        title: i18n.t('snapshotSuccess.title', i18n.locale, i18n.messages),
        content: i18n.t('snapshotSuccess.content', i18n.locale, i18n.messages),
        icon: 'success',
        handler: showItemInFolderHandler(options.snapshotPath),
      });
      break;
    case SNAPSHOT_FAILED:
      store.dispatch('addMessages', {
        id,
        type: 'resolved',
        title: i18n.t('snapshotFailed.title', i18n.locale, i18n.messages),
        content: i18n.t('snapshotFailed.content', i18n.locale, i18n.messages),
        icon: 'failed',
      });
      break;
    case LOAD_SUBVIDEO_FAILED:
      store.dispatch('addMessages', {
        type: 'state',
        title: i18n.t('loadVideoBySubtitleFailed.title', i18n.locale, i18n.messages),
        content: i18n.t('loadVideoBySubtitleFailed.content', i18n.locale, i18n.messages),
        dismissAfter: 2000,
      });
      break;
    case ENOSPC:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('errorFile.ENOSPC.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.ENOSPC.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case EACCES:
    case EPERM:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('errorFile.EACCES.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.EACCES.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case TRANSLATE_NO_LINE:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('translateBubble.bubbleTranslateNoLineFail.title', i18n.locale, i18n.messages),
        content: i18n.t('translateBubble.bubbleTranslateNoLineFail.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case TRANSLATE_REQUEST_TIMEOUT:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('translateBubble.bubbleTranslateTimeOutFail.title', i18n.locale, i18n.messages),
        content: i18n.t('translateBubble.bubbleTranslateTimeOutFail.content', i18n.locale, i18n.messages),
      });
      break;
    case TRANSLATE_REQUEST_FORBIDDEN:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('translateBubble.bubbleTranslateForbiddenFail.title', i18n.locale, i18n.messages),
        content: i18n.t('translateBubble.bubbleTranslateForbiddenFail.content', i18n.locale, i18n.messages),
      });
      break;
    case TRANSLATE_REQUEST_PERMISSION:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('translateBubble.bubbleTranslatePermissionFail.title', i18n.locale, i18n.messages),
        content: i18n.t('translateBubble.bubbleTranslatePermissionFail.content', i18n.locale, i18n.messages),
      });
      break;
    case TRANSLATE_REQUEST_ALREADY_EXISTS:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('translateBubble.bubbleTranslateExistsFail.title', i18n.locale, i18n.messages),
        content: i18n.t('translateBubble.bubbleTranslateExistsFail.content', i18n.locale, i18n.messages),
      });
      break;
    case TRANSLATE_REQUEST_RESOURCE_EXHAUSTED:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('translateBubble.bubbleTranslateExhaustedFail.title', i18n.locale, i18n.messages),
        content: i18n.t('translateBubble.bubbleTranslateExhaustedFail.content', i18n.locale, i18n.messages),
      });
      break;
    case TRANSLATE_REQUEST_PERMISSION_APPX:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('translateBubble.bubbleTranslatePermissionFail.titleAPPX', i18n.locale, i18n.messages),
        content: i18n.t('translateBubble.bubbleTranslatePermissionFail.contentAPPX', i18n.locale, i18n.messages),
      });
      break;
    case TRANSLATE_SERVER_ERROR_FAIL:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('translateBubble.bubbleTranslateServerErrorFail.title', i18n.locale, i18n.messages),
        content: i18n.t('translateBubble.bubbleTranslateServerErrorFail.content', i18n.locale, i18n.messages),
      });
      break;
    case TRANSLATE_SUCCESS:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('translateBubble.bubbleWhenSuccess.title', i18n.locale, i18n.messages),
        content: i18n.t('translateBubble.bubbleWhenSuccess.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case TRANSLATE_SUCCESS_WHEN_VIDEO_CHANGE:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('translateBubble.bubbleWhenSuccessOnOtherVideo.title', i18n.locale, i18n.messages),
        content: i18n.t('translateBubble.bubbleWhenSuccessOnOtherVideo.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case ENOENT:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('errorFile.ENOENT.title', i18n.locale, i18n.messages),
        content: i18n.t('errorFile.ENOENT.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case THUMBNAIL_GENERATE:
      store.dispatch('addMessages', {
        id,
        type: 'state',
        title: '',
        content: i18n.t('thumbnailGenerating.content', i18n.locale, i18n.messages),
      });
      break;
    case THUMBNAIL_GENERATE_SUCCESS:
      store.dispatch('addMessages', {
        id,
        type: 'resolved',
        title: i18n.t('thumbnailSuccess.title', i18n.locale, i18n.messages),
        content: i18n.t('thumbnailSuccess.content', i18n.locale, i18n.messages),
        icon: 'success',
        handler: showItemInFolderHandler(options.snapshotPath),
      });
      break;
    case THUMBNAIL_GENERATE_FAILED:
      store.dispatch('addMessages', {
        id,
        type: 'resolved',
        title: i18n.t('thumbnailFailed.title', i18n.locale, i18n.messages),
        content: i18n.t('thumbnailFailed.content', i18n.locale, i18n.messages),
        icon: 'failed',
      });
      break;
    case SUBTITLE_EDITOR_REFERENCE_LOADING:
      store.dispatch('addMessages', {
        id,
        type: 'state',
        title: i18n.t('editorBubble.referenceLoading.title', i18n.locale, i18n.messages),
        content: i18n.t('editorBubble.referenceLoading.content', i18n.locale, i18n.messages),
        dismissAfter: 10000,
      });
      break;
    case SUBTITLE_EDITOR_REFERENCE_LOAD_FAIL:
      store.dispatch('addMessages', {
        id,
        type: 'state',
        title: i18n.t('editorBubble.referenceIdNotExist.title', i18n.locale, i18n.messages),
        content: i18n.t('editorBubble.referenceIdNotExist.content', i18n.locale, i18n.messages),
        dismissAfter: 2000,
      });
      break;
    case SUBTITLE_EDITOR_SAVED:
      store.dispatch('addMessages', {
        id,
        type: 'state',
        title: i18n.t('editorBubble.saved.title', i18n.locale, i18n.messages),
        content: i18n.t('editorBubble.saved.content', i18n.locale, i18n.messages),
        dismissAfter: 2000,
      });
      break;
    case BUG_UPLOADING:
      store.dispatch('addMessages', {
        id,
        type: 'state',
        title: '',
        content: i18n.t('bugUploading.content', i18n.locale, i18n.messages),
        dismissAfter: 2000,
      });
      break;
    case BUG_UPLOAD_SUCCESS:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('bugUploadSuccess.title', i18n.locale, i18n.messages),
        content: i18n.t('bugUploadSuccess.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case BUG_UPLOAD_FAILED:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('bugUploadFailed.title', i18n.locale, i18n.messages),
        content: i18n.t('bugUploadFailed.content', i18n.locale, i18n.messages),
        dismissAfter: 5000,
      });
      break;
    case APPX_EXPORT_NOT_WORK:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        title: i18n.t('appxNotExport.title', i18n.locale, i18n.messages),
        content: i18n.t('appxNotExport.content', i18n.locale, i18n.messages),
      });
      break;
    case LOSSLESS_STREAMING_START:
      store.dispatch('addMessages', {
        id,
        type: 'resolved',
        icon: 'success',
        title: i18n.t('msg.file.losslessStreaming.sharing', i18n.locale, i18n.messages),
        content: basename(options.info.filePath),
        handler: () => {
          remote.app.emit('add-window-losslessStreaming');
        },
        dismissAfter: 20000,
      });
      break;
    case LOSSLESS_STREAMING_STOP:
      store.dispatch('addMessages', {
        id,
        type: 'result',
        content: i18n.t('msg.file.losslessStreaming.stopped', i18n.locale, i18n.messages),
        dismissAfter: 3000,
      });
      break;
    default:
      break;
  }
}

window.addBubble = addBubble;

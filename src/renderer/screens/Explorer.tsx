import { useState, useEffect } from 'react';
import {
  MPAlert,
  MPCard,
  MPFilePicker,
  MPIcon,
  MPIconButton,
  MPList,
  MPListItem,
  MPProgressCircular,
  MPTypography,
  type MPFileRejection,
} from 'material-plus-ui';
import { CirclePlay, FileUp, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/renderer/store';
import Layout from '@/renderer/components/layouts/Layout';
import { setConfig } from '@/renderer/store/slices/appScreenSlice';

// The MIME types systems give SWF files, and the extension for a file that comes
// with none. The dialog filters on this list, and the picker checks every drop
// against it.
const FLASH_FILE_ACCEPT = 'application/x-shockwave-flash,application/vnd.adobe.flash.movie,.swf';
// The picker never holds on to a file: each one goes straight to the player, and
// an empty selection lets the same file be chosen again.
const NO_FILES: File[] = [];

export default function Explorer() {
  const dispatch = useDispatch();
  const stateAppScreen = useSelector((state: RootState) => state.appScreen);
  const [t] = useTranslation(['common', 'notice', 'menu']);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [flashContentError, setFlashContentError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const runFlash = (fileName: string, filePath: string) => {
    setLoading(true);
    dispatch(
      setConfig({
        flashFileName: fileName || 'swf',
        flashFilePath: filePath,
        appConfigEmulatePlayerVersion: 0,
      }),
    );
    window.mainApi.send('appendRecentFiles', filePath);
    navigate('/player');
    return true;
  };
  const showWrongFileType = () => {
    setLoading(false);
    setFlashContentError(true);
    setErrorMessage(t('notice:wrong-file-type'));
  };

  // A drop or a dialog pick. The picker keeps one file and has already checked
  // its type, so only a file with no path on disk is left to turn away.
  const handleFilesChange = (files: File[]) => {
    const file = files[0];
    const filePath = file ? window.mainApi.showFilePath(file) : '';

    if (!filePath) {
      showWrongFileType();
      return;
    }

    runFlash(file.name, filePath);
  };

  // A file of another type is refused. Further files dropped with a movie are
  // refused as well, while the first one still plays.
  const handleReject = (rejections: MPFileRejection[]) => {
    if (rejections.some((rejection) => rejection.reason === 'type')) {
      showWrongFileType();
    }
  };

  const handleClickRecentFile = async (ev, file) => {
    if (ev) ev.preventDefault();
    if (!file) return;
    window.mainApi.send('checkFileExist', {
      name: await window.mainApi.getFileNameFromPath(file, true),
      path: file,
    });
  };

  const handleRemoveRecentFiles = () => {
    window.mainApi.send('removeAllRecentFile');
    dispatch(
      setConfig({
        recentFiles: [],
      }),
    );
  };

  useEffect(() => {
    window.mainApi.receive('receiveRecentFiles', async (event, argument) => {
      dispatch(
        setConfig({
          recentFiles: argument,
        }),
      );
    });

    window.mainApi.receive('receiveFileExist', async (event, argument) => {
      if (argument.exist) {
        runFlash(argument.name, argument.path);
      } else {
        window.mainApi.send('removeRecentFile', {
          path: argument.path,
          title: t('common:dialog-title-info'),
          message: t('notice:not-found-recent-file'),
        });
      }
    });

    window.mainApi.send('getRecentFiles');

    return () => {
      window.mainApi.removeListener('receiveRecentFiles');
      window.mainApi.removeListener('receiveFileExist');
    };
  }, []);

  return (
    <Layout header={!loading} center={loading} title={t('main-title') as string}>
      <div className="app-scroll">
        {!loading && (
          <>
            <MPCard className="app-panel" variant="elevated" elevation={1} density={0}>
              <div data-testid="uiFileOpen" className="app-dropzone">
                <MPFilePicker
                  accept={FLASH_FILE_ACCEPT}
                  value={NO_FILES}
                  showList={false}
                  title={<strong>{t('notice:drag-drop-execute')}</strong>}
                  icon={<MPIcon icon={FileUp} size={32} />}
                  onFilesChange={handleFilesChange}
                  onReject={handleReject}
                />
              </div>
              {flashContentError && (
                <MPAlert color="error" variant="tonal">
                  {errorMessage}
                </MPAlert>
              )}
            </MPCard>
            <MPCard className="app-panel" variant="elevated" elevation={1} density={0}>
              <div className="app-recent__header">
                <h2 className="app-panel__title">
                  <strong>{t('common:recent-file-title')}</strong>
                </h2>
                <MPIconButton
                  variant="text"
                  label={t('common:recent-file-title')}
                  onClick={handleRemoveRecentFiles}
                  disabled={stateAppScreen.recentFiles.length < 1}
                  icon={<MPIcon icon={Trash2} size={18} />}
                />
              </div>
              {stateAppScreen.recentFiles.length < 1 && (
                <MPTypography level="caption">{t('notice:no-recent-files')}</MPTypography>
              )}
              {stateAppScreen.recentFiles.length > 0 && (
                <MPList className="app-recent__list" variant="text" aria-label="recent files">
                  {stateAppScreen.recentFiles.map((val) => (
                    <MPListItem
                      key={val}
                      startIcon={<MPIcon icon={CirclePlay} size={18} />}
                      onClick={(e) => handleClickRecentFile(e, val)}
                    >
                      {val}
                    </MPListItem>
                  ))}
                </MPList>
              )}
            </MPCard>
          </>
        )}
        {loading && (
          <div className="app-loading">
            <MPProgressCircular size="xl" />
            <MPTypography className="app-loading__text" level="body">
              <strong>{t('player-loading')}</strong>
            </MPTypography>
          </div>
        )}
      </div>
    </Layout>
  );
}

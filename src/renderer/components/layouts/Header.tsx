import { useMemo } from 'react';
import { MPHeader, MPIcon, MPIconButton, MPSelect, MPTypography } from 'material-plus-ui';
import { ArrowLeft, BarChart3, CircleHelp, Settings } from 'lucide-react';
import { arrRange } from 'qsu';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/renderer/store';
import { setConfig } from '@/renderer/store/slices/appScreenSlice';

export default function Header({
  title,
  withBackButton,
}: {
  title: string;
  withBackButton: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const stateAppScreen = useSelector((state: RootState) => state.appScreen);
  const playerVersionItems = useMemo(
    () => arrRange(0, 32).map((value) => ({ value, label: value === 0 ? 'Auto' : `${value}` })),
    [],
  );

  const handleGoHome = (e) => {
    if (e) e.preventDefault();
    if (location.pathname === '/') {
      window.location.reload();
    } else {
      navigate('/explorer');
    }
  };

  const handleOpenMetadata = () => {
    dispatch(setConfig({ dialogMetadataOpen: true }));
  };

  const handleOpenAbout = () => {
    dispatch(setConfig({ dialogAboutOpen: true }));
  };

  const handleOpenSettings = () => {
    dispatch(setConfig({ dialogSettingsOpen: true }));
  };

  const handleFlashEmulatePlayerVersionChange = (value) => {
    dispatch(setConfig({ appConfigEmulatePlayerVersion: Number(value) }));
  };

  return (
    <MPHeader
      className="app-header"
      position="fixed"
      variant="filled"
      size="xs"
      elevation={1}
      maxWidth="none"
      brand={
        <>
          {withBackButton && (
            <MPIconButton
              variant="text"
              size="xs"
              label="back"
              onClick={handleGoHome}
              icon={<MPIcon icon={ArrowLeft} size={18} />}
            />
          )}
          <MPTypography className="app-header__title" level="body">
            {title}
          </MPTypography>
        </>
      }
      actions={
        <div className="app-header__actions">
          {location.pathname === '/player' && (
            <>
              {stateAppScreen.appConfigShowPlayerVersionSelect && (
                <MPSelect
                  size="xs"
                  name="playerVersion"
                  id="player-version"
                  items={playerVersionItems}
                  value={stateAppScreen.appConfigEmulatePlayerVersion}
                  onValueChange={handleFlashEmulatePlayerVersionChange}
                />
              )}
              <MPIconButton
                variant="text"
                size="xs"
                label="metadata"
                onClick={() => handleOpenMetadata()}
                icon={<MPIcon icon={BarChart3} size={18} />}
              />
            </>
          )}
          {!withBackButton && (
            <>
              <MPIconButton
                variant="text"
                size="xs"
                label="about"
                onClick={handleOpenAbout}
                icon={<MPIcon icon={CircleHelp} size={18} />}
              />
              <MPIconButton
                variant="text"
                size="xs"
                label="settings"
                onClick={handleOpenSettings}
                icon={<MPIcon icon={Settings} size={18} />}
              />
            </>
          )}
        </div>
      }
    />
  );
}

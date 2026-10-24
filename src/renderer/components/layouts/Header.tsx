import { ReactElement, useMemo } from 'react';
import {
  MPHeader,
  MPIcon,
  MPIconButton,
  MPSelect,
  MPTooltip,
  MPTypography,
  MPVisuallyHidden,
} from 'material-plus-ui';
import { ArrowLeft, BarChart3, CircleHelp, LucideIcon, Settings } from 'lucide-react';
import { arrRange } from 'qsu';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/renderer/store';
import { setConfig } from '@/renderer/store/slices/appScreenSlice';

// An icon alone names nothing, so each button carries its name and shows it in
// a tooltip.
const HeaderButton = ({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}): ReactElement => (
  <MPTooltip content={label}>
    <MPIconButton
      variant="text"
      size="xs"
      label={label}
      onClick={onClick}
      icon={<MPIcon icon={icon} size={18} />}
    />
  </MPTooltip>
);

export default function Header({
  title,
  withBackButton,
}: {
  title: string;
  withBackButton: boolean;
}) {
  const [t] = useTranslation(['menu']);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const stateAppScreen = useSelector((state: RootState) => state.appScreen);
  const playerVersionItems = useMemo(
    () => arrRange(0, 32).map((value) => ({ value, label: value === 0 ? 'Auto' : `${value}` })),
    [],
  );

  const handleGoHome = () => {
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
            <HeaderButton label={t('back')} icon={ArrowLeft} onClick={handleGoHome} />
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
                <>
                  <label htmlFor="player-version">
                    <MPVisuallyHidden>{t('player-version')}</MPVisuallyHidden>
                  </label>
                  <MPSelect
                    size="xs"
                    name="playerVersion"
                    id="player-version"
                    items={playerVersionItems}
                    value={stateAppScreen.appConfigEmulatePlayerVersion}
                    onValueChange={handleFlashEmulatePlayerVersionChange}
                  />
                </>
              )}
              <HeaderButton label={t('file-info')} icon={BarChart3} onClick={handleOpenMetadata} />
            </>
          )}
          <HeaderButton label={t('app-info')} icon={CircleHelp} onClick={handleOpenAbout} />
          <HeaderButton label={t('settings')} icon={Settings} onClick={handleOpenSettings} />
        </div>
      }
    />
  );
}

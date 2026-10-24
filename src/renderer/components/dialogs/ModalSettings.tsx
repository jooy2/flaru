import { ReactNode, useEffect, useId, useState } from 'react';
import {
  MPButton,
  MPCheckbox,
  MPDialog,
  MPList,
  MPListItem,
  MPRadio,
  MPRadioGroup,
  MPSegmentedButton,
  MPSelect,
  MPTypography,
  MPVisuallyHidden,
} from 'material-plus-ui';
import { useMPMediaQuery } from 'material-plus-ui/hooks';
import { Gamepad2, Moon, SlidersHorizontal, Sun, SunMoon, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/renderer/store';
import { setConfig } from '@/renderer/store/slices/appScreenSlice';
import ModalLocalStorageView from '@/renderer/components/dialogs/ModalLocalStorageView';
import { DEBUG_LOG_LEVELS, DebugLogLevel } from '@/renderer/utils/ruffleLog';

const LANGUAGES = ['auto', 'ko', 'en', 'es', 'pt', 'de', 'fr', 'ja'];
// In seconds. The first is the limit Flash Player and Ruffle use by default.
const SCRIPT_TIME_LIMITS = [15, 30, 60, 120];
// Ruffle's level names are kept as Ruffle writes them.
const DEBUG_LOG_LABELS: Record<Exclude<DebugLogLevel, 'off'>, string> = {
  error: 'Error',
  warn: 'Warn',
  info: 'Info',
  debug: 'Debug',
  trace: 'Trace',
};
const GROUPS = [
  { value: 'general', label: 'settings-general', Icon: SlidersHorizontal },
  { value: 'emulation', label: 'settings-emulation', Icon: Gamepad2 },
  { value: 'advanced', label: 'settings-advanced', Icon: Wrench },
];

const SettingSection = ({
  titleId,
  title,
  desc,
  children,
}: {
  titleId: string;
  title: string;
  desc: string;
  children: ReactNode;
}) => (
  <section className="app-settings__section" aria-labelledby={titleId}>
    <h3 className="app-settings__title" id={titleId}>
      {title}
    </h3>
    <MPTypography className="app-settings__desc" level="caption">
      {desc}
    </MPTypography>
    {children}
  </section>
);

// A radio group takes its name from a label of its own, which the section
// heading above it already shows.
const HiddenLabel = ({ children }: { children: string }) => (
  <MPVisuallyHidden>{children}</MPVisuallyHidden>
);

// A select draws its own label in the notch of its outline, so it is named by a
// label element beside it instead.
const HiddenSelectLabel = ({ htmlFor, children }: { htmlFor: string; children: string }) => (
  <label htmlFor={htmlFor}>
    <MPVisuallyHidden>{children}</MPVisuallyHidden>
  </label>
);

const RestartNotice = ({
  message,
  actionLabel,
  onRestart,
}: {
  message: string;
  actionLabel: string;
  onRestart: () => void;
}) => (
  <div className="app-settings__notice">
    <MPTypography level="body" color="error">
      {message}
    </MPTypography>
    <MPButton variant="tonal" color="secondary" onClick={onRestart}>
      {actionLabel}
    </MPButton>
  </div>
);

export default function ModalSettings() {
  const stateAppScreen = useSelector((state: RootState) => state.appScreen);
  const dispatch = useDispatch();
  const location = useLocation();
  const idPrefix = useId();
  const [t, i18n] = useTranslation(['common', 'notice', 'menu']);
  const [group, setGroup] = useState(GROUPS[0].value);
  const [themeCheck, setThemeCheck] = useState(stateAppScreen.appConfigTheme);
  const [preferredRendererCheck, setPreferredRendererCheck] = useState(
    stateAppScreen.appConfigPreferredRenderer,
  );
  const [qualityCheck, setQualityCheck] = useState(stateAppScreen.appConfigQuality);
  const [playerRuntimeCheck, setPlayerRuntimeCheck] = useState(
    stateAppScreen.appConfigPlayerRuntime,
  );
  const [deviceFontRendererCheck, setDeviceFontRendererCheck] = useState(
    stateAppScreen.appConfigDeviceFontRenderer,
  );
  const [scaleCheck, setScaleCheck] = useState(stateAppScreen.appConfigScale);
  const [letterboxModeCheck, setLetterboxModeCheck] = useState(
    stateAppScreen.appConfigLetterboxMode,
  );
  const [maxExecutionDuration, setMaxExecutionDuration] = useState(
    stateAppScreen.appConfigMaxExecutionDuration,
  );
  const [language, setLanguage] = useState(stateAppScreen.appConfigLanguage);
  const [autoLaunch, setAutoLaunchState] = useState({ isSupported: false, isEnabled: false });
  const [hideHeaderChecked, setHideHeaderChecked] = useState(stateAppScreen.appConfigHideHeader);
  const [hideContextChecked, setHideContextChecked] = useState(stateAppScreen.appConfigHideContext);
  const [showPlayerControllerChecked, setShowPlayerControllerChecked] = useState(
    stateAppScreen.appConfigShowPlayerController,
  );
  const [showPlayerVersionSelectChecked, setShowPlayerVersionSelectChecked] = useState(
    stateAppScreen.appConfigShowPlayerVersionSelect,
  );
  const [restoreWindowBoundsChecked, setRestoreBoundsChecked] = useState(
    stateAppScreen.appConfigRestoreWindowBounds,
  );
  const [adjustOriginalSizeChecked, setAdjustOriginalSizeChecked] = useState(
    stateAppScreen.appConfigAdjustOriginalSize,
  );
  const [forceScaleChecked, setForceScaleChecked] = useState(stateAppScreen.appConfigForceScale);
  const [allowFullscreenChecked, setAllowFullscreenChecked] = useState(
    stateAppScreen.appConfigAllowFullscreen,
  );
  const [pauseInBackgroundChecked, setPauseInBackgroundChecked] = useState(
    stateAppScreen.appConfigPauseInBackground,
  );
  const [hardwareAccelerationChecked, setHardwareAccelerationChecked] = useState(
    stateAppScreen.appConfigHardwareAcceleration,
  );
  const [debugLogLevel, setDebugLogLevel] = useState(stateAppScreen.appConfigDebugLogLevel);
  const prefersDarkMode = useMPMediaQuery('(prefers-color-scheme: dark)');
  const secondsFormat = new Intl.NumberFormat(i18n.language, {
    style: 'unit',
    unit: 'second',
    unitDisplay: 'long',
  });
  // A file that is playing reads most emulation options only when it starts,
  // so while one plays the dialog says when a change reaches it.
  const description =
    location.pathname === '/player'
      ? t('settings-info-playing', { restart: t('menu:replay') })
      : t('settings-info');

  // The login item may have been changed in the system settings since the
  // dialog last opened.
  useEffect(() => {
    if (stateAppScreen.dialogSettingsOpen) {
      window.mainApi
        .invoke('getAutoLaunch')
        .then(setAutoLaunchState)
        .catch(() => null);
    }
  }, [stateAppScreen.dialogSettingsOpen]);

  const handleRadioChange = (name: string, value: string): void => {
    switch (name) {
      case 'themeCheck':
        setThemeCheck(value);
        window.mainApi.send('setAppConfig', { theme: value });
        dispatch(setConfig({ appConfigTheme: value }));
        if (value === 'auto') {
          dispatch(setConfig({ isDarkTheme: prefersDarkMode }));
        } else {
          dispatch(setConfig({ isDarkTheme: value !== 'light' }));
        }
        break;
      case 'preferredRendererCheck':
        setPreferredRendererCheck(value);
        window.mainApi.send('setAppConfig', { preferredRenderer: value });
        dispatch(setConfig({ appConfigPreferredRenderer: value }));
        break;
      case 'qualityCheck':
        setQualityCheck(value);
        window.mainApi.send('setAppConfig', { quality: value });
        dispatch(setConfig({ appConfigQuality: value }));
        break;
      case 'playerRuntimeCheck':
        setPlayerRuntimeCheck(value);
        window.mainApi.send('setAppConfig', { playerRuntime: value });
        dispatch(setConfig({ appConfigPlayerRuntime: value }));
        break;
      case 'deviceFontRendererCheck':
        setDeviceFontRendererCheck(value);
        window.mainApi.send('setAppConfig', { deviceFontRenderer: value });
        dispatch(setConfig({ appConfigDeviceFontRenderer: value }));
        break;
      case 'scaleCheck':
        setScaleCheck(value);
        window.mainApi.send('setAppConfig', { scale: value });
        dispatch(setConfig({ appConfigScale: value }));
        break;
      case 'letterboxModeCheck':
        setLetterboxModeCheck(value);
        window.mainApi.send('setAppConfig', { letterboxMode: value });
        dispatch(setConfig({ appConfigLetterboxMode: value }));
        break;
      default:
        break;
    }
  };

  const handleCheckboxChange = (name: string, value: boolean): void => {
    switch (name) {
      case 'hideHeaderChecked':
        setHideHeaderChecked(value);
        window.mainApi.send('setAppConfig', { hideHeader: value });
        dispatch(setConfig({ appConfigHideHeader: value }));
        break;
      case 'hideContextChecked':
        setHideContextChecked(value);
        window.mainApi.send('setAppConfig', { hideContext: value });
        dispatch(setConfig({ appConfigHideContext: value }));
        break;
      case 'restoreWindowBoundsChecked':
        setRestoreBoundsChecked(value);
        window.mainApi.send('setAppConfig', { restoreWindowBounds: value });
        dispatch(setConfig({ appConfigRestoreWindowBounds: value }));
        break;
      case 'adjustOriginalSizeChecked':
        setAdjustOriginalSizeChecked(value);
        window.mainApi.send('setAppConfig', { adjustOriginalSize: value });
        dispatch(setConfig({ appConfigAdjustOriginalSize: value }));
        break;
      case 'showPlayerVersionSelectChecked':
        setShowPlayerVersionSelectChecked(value);
        window.mainApi.send('setAppConfig', { showPlayerVersionSelect: value });
        dispatch(setConfig({ appConfigShowPlayerVersionSelect: value }));
        break;
      case 'showPlayerControllerChecked':
        setShowPlayerControllerChecked(value);
        window.mainApi.send('setAppConfig', { showPlayerController: value });
        dispatch(setConfig({ appConfigShowPlayerController: value }));
        break;
      case 'forceScaleChecked':
        setForceScaleChecked(value);
        window.mainApi.send('setAppConfig', { forceScale: value });
        dispatch(setConfig({ appConfigForceScale: value }));
        break;
      case 'allowFullscreenChecked':
        setAllowFullscreenChecked(value);
        window.mainApi.send('setAppConfig', { allowFullscreen: value });
        dispatch(setConfig({ appConfigAllowFullscreen: value }));
        break;
      case 'pauseInBackgroundChecked':
        setPauseInBackgroundChecked(value);
        window.mainApi.send('setAppConfig', { pauseInBackground: value });
        dispatch(setConfig({ appConfigPauseInBackground: value }));
        break;
      case 'hardwareAccelerationChecked':
        setHardwareAccelerationChecked(value);
        window.mainApi.send('setAppConfig', { hardwareAcceleration: value });
        dispatch(setConfig({ appConfigHardwareAcceleration: value }));
        break;
      default:
        break;
    }
  };

  const handleLanguageChange = async (value): Promise<void> => {
    const next = String(value);
    setLanguage(next);
    window.mainApi.send('setAppConfig', { language: next });
    dispatch(setConfig({ appConfigLanguage: next }));
    await i18n.changeLanguage(next);
  };

  const handleMaxExecutionDurationChange = (value): void => {
    const next = Number(value);
    setMaxExecutionDuration(next);
    window.mainApi.send('setAppConfig', { maxExecutionDuration: next });
    dispatch(setConfig({ appConfigMaxExecutionDuration: next }));
  };

  const handleDebugLogLevelChange = (value: DebugLogLevel): void => {
    setDebugLogLevel(value);
    window.mainApi.send('setAppConfig', { debugLogLevel: value });
    dispatch(setConfig({ appConfigDebugLogLevel: value }));
  };

  const handleAutoLaunchChange = async (checked: boolean): Promise<void> => {
    setAutoLaunchState((state) => ({ ...state, isEnabled: checked }));

    try {
      setAutoLaunchState(await window.mainApi.invoke('setAutoLaunch', checked));
    } catch {
      // The box goes back to what the system still has.
      setAutoLaunchState((state) => ({ ...state, isEnabled: !checked }));
    }
  };

  const handleReset = (): void => {
    window.mainApi.send('resetAppConfig');
  };

  const handleRestart = (): void => {
    window.mainApi.send('restart');
  };

  const handleOpenLocalStorageViewModal = (): void => {
    dispatch(setConfig({ dialogLocalStorageViewOpen: true }));
  };

  const handleDialogClose = (): void => {
    dispatch(setConfig({ dialogSettingsOpen: false }));
  };

  const checkbox = (name: string, checked: boolean, label: string, className?: string) => (
    <MPCheckbox
      className={className}
      name={name}
      checked={checked}
      onCheckedChange={(value) => handleCheckboxChange(name, value)}
      label={t(label)}
    />
  );

  const radioGroup = (
    key: string,
    name: string,
    value: string,
    choices: ReactNode,
    orientation: 'horizontal' | 'vertical' = 'horizontal',
  ) => (
    <MPRadioGroup
      className="app-settings__choices"
      orientation={orientation}
      label={<HiddenLabel>{t(key)}</HiddenLabel>}
      name={name}
      value={value}
      onValueChange={(next) => handleRadioChange(name, next)}
    >
      {choices}
    </MPRadioGroup>
  );

  const generalPanel = (
    <>
      <SettingSection
        titleId={`${idPrefix}-language`}
        title={t('settings-language-title')}
        desc={t('settings-language-desc')}
      >
        <HiddenSelectLabel htmlFor={`${idPrefix}-language-select`}>
          {t('settings-language-title')}
        </HiddenSelectLabel>
        <MPSelect
          className="app-settings__select"
          fullWidth
          name="language"
          id={`${idPrefix}-language-select`}
          items={LANGUAGES.map((value) => ({
            value,
            label: t(`menu:language-${value}`),
          }))}
          value={language}
          onValueChange={handleLanguageChange}
        />
      </SettingSection>
      <SettingSection
        titleId={`${idPrefix}-theme`}
        title={t('settings-title-4')}
        desc={t('settings-desc-4')}
      >
        <MPSegmentedButton
          aria-label={t('settings-title-4')}
          items={[
            { value: 'auto', label: t('menu:theme-auto'), icon: <SunMoon /> },
            { value: 'light', label: t('menu:theme-light'), icon: <Sun /> },
            { value: 'dark', label: t('menu:theme-dark'), icon: <Moon /> },
          ]}
          value={[themeCheck]}
          onValueChange={(value) => {
            // A tap on the chosen theme would leave none chosen.
            if (value.length > 0) {
              handleRadioChange('themeCheck', value[0]);
            }
          }}
        />
      </SettingSection>
      <SettingSection
        titleId={`${idPrefix}-window`}
        title={t('settings-window-title')}
        desc={t('settings-window-desc')}
      >
        <div className="app-settings__options">
          {autoLaunch.isSupported && (
            <MPCheckbox
              checked={autoLaunch.isEnabled}
              onCheckedChange={handleAutoLaunchChange}
              label={t('menu:auto-launch')}
            />
          )}
          {checkbox(
            'restoreWindowBoundsChecked',
            restoreWindowBoundsChecked,
            'menu:restore-bounds',
          )}
        </div>
      </SettingSection>
    </>
  );

  const emulationPanel = (
    <>
      <SettingSection
        titleId={`${idPrefix}-player-view`}
        title={t('settings-title-2')}
        desc={t('settings-desc-2')}
      >
        <div className="app-settings__options">
          {checkbox(
            'showPlayerControllerChecked',
            showPlayerControllerChecked,
            'menu:show-player-controller',
          )}
          {checkbox('hideHeaderChecked', hideHeaderChecked, 'menu:hide-header')}
          {checkbox(
            'adjustOriginalSizeChecked',
            adjustOriginalSizeChecked,
            'menu:adjust-original-size',
          )}
          {checkbox(
            'showPlayerVersionSelectChecked',
            showPlayerVersionSelectChecked,
            'menu:show-player-version-select',
          )}
          {checkbox('hideContextChecked', hideContextChecked, 'menu:hide-context')}
        </div>
      </SettingSection>
      <SettingSection
        titleId={`${idPrefix}-scale`}
        title={t('settings-scale-title')}
        desc={t('settings-scale-desc')}
      >
        <div className="app-settings__options">
          {radioGroup(
            'settings-scale-title',
            'scaleCheck',
            scaleCheck,
            <>
              <MPRadio
                value="showAll"
                label={t('menu:option-recommended', { option: t('menu:scale-show-all') })}
              />
              <MPRadio value="noBorder" label={t('menu:scale-no-border')} />
              <MPRadio value="exactFit" label={t('menu:scale-exact-fit')} />
              <MPRadio value="noScale" label={t('menu:scale-no-scale')} />
            </>,
            'vertical',
          )}
          {checkbox('forceScaleChecked', forceScaleChecked, 'menu:force-scale')}
        </div>
      </SettingSection>
      <SettingSection
        titleId={`${idPrefix}-letterbox`}
        title={t('settings-letterbox-title')}
        desc={t('settings-letterbox-desc')}
      >
        {radioGroup(
          'settings-letterbox-title',
          'letterboxModeCheck',
          letterboxModeCheck,
          <>
            <MPRadio value="off" label={t('menu:letterbox-off')} />
            <MPRadio value="fullscreen" label={t('menu:letterbox-fullscreen')} />
            <MPRadio value="on" label={t('menu:letterbox-on')} />
          </>,
        )}
      </SettingSection>
      <SettingSection
        titleId={`${idPrefix}-renderer`}
        title={t('settings-title-5')}
        desc={t('settings-desc-5')}
      >
        {radioGroup(
          'settings-title-5',
          'preferredRendererCheck',
          preferredRendererCheck,
          <>
            <MPRadio value="auto" label={t('menu:renderer-auto')} />
            <MPRadio value="wgpu-webgl" label={t('menu:renderer-wgpu-webgl')} />
            <MPRadio value="webgl" label={t('menu:renderer-webgl')} />
            <MPRadio value="canvas" label={t('menu:renderer-canvas')} />
            <MPRadio value="webgpu" label={t('menu:renderer-webgpu')} />
          </>,
          'vertical',
        )}
      </SettingSection>
      <SettingSection
        titleId={`${idPrefix}-quality`}
        title={t('settings-title-6')}
        desc={t('settings-desc-6')}
      >
        {radioGroup(
          'settings-title-6',
          'qualityCheck',
          qualityCheck,
          <>
            <MPRadio value="low" label={t('menu:quality-low')} />
            <MPRadio value="medium" label={t('menu:quality-medium')} />
            <MPRadio value="high" label={t('menu:quality-high')} />
            <MPRadio value="best" label={t('menu:quality-best')} />
            <MPRadio value="8x8" label="8x8" />
            <MPRadio value="16x16" label="16x16" />
          </>,
        )}
      </SettingSection>
      <SettingSection
        titleId={`${idPrefix}-font-renderer`}
        title={t('settings-title-8')}
        desc={t('settings-desc-8', { e: 'Embedded', c: 'Canvas' })}
      >
        {radioGroup(
          'settings-title-8',
          'deviceFontRendererCheck',
          deviceFontRendererCheck,
          <>
            <MPRadio value="embedded" label="Embedded" />
            <MPRadio value="canvas" label={t('menu:option-experimental', { option: 'Canvas' })} />
          </>,
        )}
      </SettingSection>
      <SettingSection
        titleId={`${idPrefix}-playback`}
        title={t('settings-playback-title')}
        desc={t('settings-playback-desc')}
      >
        <div className="app-settings__options">
          {checkbox('allowFullscreenChecked', allowFullscreenChecked, 'menu:allow-fullscreen')}
          {checkbox(
            'pauseInBackgroundChecked',
            pauseInBackgroundChecked,
            'menu:pause-in-background',
          )}
        </div>
      </SettingSection>
      <SettingSection
        titleId={`${idPrefix}-script-limit`}
        title={t('settings-script-limit-title')}
        desc={t('settings-script-limit-desc')}
      >
        <HiddenSelectLabel htmlFor={`${idPrefix}-script-limit-select`}>
          {t('settings-script-limit-title')}
        </HiddenSelectLabel>
        <MPSelect
          className="app-settings__select"
          fullWidth
          name="maxExecutionDuration"
          id={`${idPrefix}-script-limit-select`}
          items={SCRIPT_TIME_LIMITS.map((value) => ({
            value,
            label:
              value === SCRIPT_TIME_LIMITS[0]
                ? t('menu:option-recommended', { option: secondsFormat.format(value) })
                : secondsFormat.format(value),
          }))}
          value={maxExecutionDuration}
          onValueChange={handleMaxExecutionDurationChange}
        />
      </SettingSection>
      <SettingSection
        titleId={`${idPrefix}-runtime`}
        title={t('settings-title-7')}
        desc={t('settings-desc-7')}
      >
        {radioGroup(
          'settings-title-7',
          'playerRuntimeCheck',
          playerRuntimeCheck,
          <>
            <MPRadio
              value="flashPlayer"
              label={t('menu:option-recommended', { option: 'Adobe Flash Player' })}
            />
            <MPRadio value="air" label="Adobe AIR" />
          </>,
        )}
      </SettingSection>
    </>
  );

  const advancedPanel = (
    <>
      <SettingSection
        titleId={`${idPrefix}-acceleration`}
        title={t('settings-acceleration-title')}
        desc={t('settings-acceleration-desc')}
      >
        {checkbox(
          'hardwareAccelerationChecked',
          hardwareAccelerationChecked,
          'menu:hardware-acceleration',
        )}
        {/* Only a value that differs from the one this run started with
            needs a restart. */}
        {hardwareAccelerationChecked !==
          stateAppScreen.mainGlobalValues.ENV_HARDWARE_ACCELERATION && (
          <RestartNotice
            message={t('restart-required')}
            actionLabel={t('menu:restart')}
            onRestart={handleRestart}
          />
        )}
      </SettingSection>
      <SettingSection
        titleId={`${idPrefix}-debug-log`}
        title={t('settings-debug-log-title')}
        desc={t('settings-debug-log-desc')}
      >
        <MPSegmentedButton
          aria-label={t('settings-debug-log-title')}
          showCheck={false}
          items={DEBUG_LOG_LEVELS.map((level) => ({
            value: level,
            label: level === 'off' ? t('menu:debug-log-off') : DEBUG_LOG_LABELS[level],
          }))}
          value={[debugLogLevel]}
          onValueChange={(value) => {
            // A tap on the chosen level would leave none chosen.
            if (value.length > 0) {
              handleDebugLogLevelChange(value[0] as DebugLogLevel);
            }
          }}
        />
      </SettingSection>
      <SettingSection
        titleId={`${idPrefix}-advanced`}
        title={t('settings-other-title')}
        desc={t('settings-other-desc')}
      >
        <MPButton color="primary" variant="filled" onClick={handleOpenLocalStorageViewModal}>
          {t('menu:manage-data')}
        </MPButton>
      </SettingSection>
      <SettingSection
        titleId={`${idPrefix}-reset`}
        title={t('settings-reset-title')}
        desc={t('settings-reset-desc')}
      >
        <MPButton variant="filled" color="secondary" onClick={handleReset}>
          {t('menu:reset-and-restart')}
        </MPButton>
      </SettingSection>
    </>
  );

  const panels = { general: generalPanel, emulation: emulationPanel, advanced: advancedPanel };

  return (
    <>
      <MPDialog
        width={900}
        dividers
        open={stateAppScreen.dialogSettingsOpen}
        onOpenChange={(next) => {
          if (!next) handleDialogClose();
        }}
        title={t('menu:settings')}
        description={description}
        actions={
          <MPButton variant="text" color="primary" onClick={handleDialogClose}>
            {t('menu:close')}
          </MPButton>
        }
      >
        {/* The dialog keeps one height whichever group is open, and only the
            panel beside the list scrolls. */}
        <div className="app-settings">
          <nav className="app-settings__nav" aria-label={t('menu:settings')}>
            <MPList variant="text" aria-label={t('menu:settings')}>
              {GROUPS.map(({ value, label, Icon }) => (
                <MPListItem
                  key={value}
                  selected={group === value}
                  startIcon={<Icon size={18} />}
                  onClick={() => setGroup(value)}
                >
                  {t(label)}
                </MPListItem>
              ))}
            </MPList>
          </nav>
          <div key={group} className="app-settings__panel">
            {panels[group]}
          </div>
        </div>
      </MPDialog>
      <ModalLocalStorageView />
    </>
  );
}

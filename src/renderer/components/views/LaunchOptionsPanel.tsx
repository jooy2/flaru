import { useId } from 'react';
import {
  MPButton,
  MPCard,
  MPCheckbox,
  MPNumberField,
  MPSelect,
  MPTextField,
  MPTypography,
} from 'material-plus-ui';
import { arrRange, clamp } from 'qsu';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '@/renderer/store';
import { setConfig } from '@/renderer/store/slices/appScreenSlice';
import {
  DEFAULT_LAUNCH_OPTIONS,
  isDefaultLaunchOptions,
  LAUNCH_LIMITS,
  LaunchOptions,
} from '@/renderer/utils/launchOptions';

// The options the explorer applies to the next file it starts, for as long as
// the app runs. The settings dialog keeps everything that applies to every file.
export default function LaunchOptionsPanel() {
  const [t] = useTranslation(['common', 'menu']);
  const idPrefix = useId();
  const dispatch = useDispatch();
  const options = useSelector((state: RootState) => state.appScreen.launchOptions);
  const playerVersions = arrRange(0, 32).map((value) => ({
    value,
    label: value === 0 ? t('auto') : String(value),
  }));

  const setOption = <K extends keyof LaunchOptions>(key: K, value: LaunchOptions[K]) => {
    dispatch(setConfig({ launchOptions: { ...options, [key]: value } }));
  };

  return (
    <MPCard className="app-panel" variant="elevated" elevation={1} density={0}>
      <section className="app-launch" aria-labelledby={`${idPrefix}-title`}>
        <div className="app-launch__header">
          <div>
            <h2 className="app-panel__title" id={`${idPrefix}-title`}>
              <strong>{t('launch-title')}</strong>
            </h2>
            <MPTypography className="app-launch__desc" level="caption">
              {t('launch-desc')}
            </MPTypography>
          </div>
          <MPButton
            variant="text"
            disabled={isDefaultLaunchOptions(options)}
            onClick={() => dispatch(setConfig({ launchOptions: DEFAULT_LAUNCH_OPTIONS }))}
          >
            {t('launch-reset')}
          </MPButton>
        </div>
        <MPCheckbox
          checked={options.strictMode}
          onCheckedChange={(checked) => setOption('strictMode', checked)}
          label={t('launch-strict-mode')}
        />
        <div className="app-launch__fields">
          <MPSelect
            fullWidth
            label={t('menu:player-version')}
            items={playerVersions}
            value={options.playerVersion}
            onValueChange={(value) => setOption('playerVersion', Number(value))}
          />
          <MPNumberField
            fullWidth
            label={t('launch-frame-rate')}
            description={t('launch-frame-rate-desc')}
            min={0}
            max={LAUNCH_LIMITS.frameRate}
            value={options.frameRate}
            onValueCommitted={(value) =>
              setOption('frameRate', clamp(value ?? 0, 0, LAUNCH_LIMITS.frameRate))
            }
          />
          <div className="app-launch__params">
            <MPTextField
              fullWidth
              label={t('launch-params')}
              maxLength={LAUNCH_LIMITS.parameters}
              value={options.parameters}
              onChange={(value) => setOption('parameters', value)}
            />
            <MPTypography className="app-launch__desc" level="caption">
              {t('launch-params-desc')}
            </MPTypography>
          </div>
        </div>
      </section>
    </MPCard>
  );
}

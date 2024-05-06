/** @jsxImportSource @emotion/react */
import { useDispatch, useSelector } from 'react-redux';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import { useTranslation } from 'react-i18next';

import { userSelectNone } from '@/renderer/utils/styles';
import { RootState } from '@/renderer/store';
import { setConfig } from '@/renderer/store/slices/appScreenSlice';
import { useMemo, useState } from 'react';
import ModalConfirm from '@/renderer/components/dialogs/ModalConfirm';
import { css } from '@emotion/react';

const ModalLocalStorageView = () => {
  const [t] = useTranslation(['common', 'notice', 'menu']);
  const dispatch = useDispatch();
  const stateAppScreen = useSelector((state: RootState) => state.appScreen);
  const [data, setData] = useState(JSON.stringify(localStorage));
  const [error, setError] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const i18LngValue = useMemo(
    () => localStorage.getItem('i18nextLng') || 'en',
    [stateAppScreen.appConfigLanguage],
  );

  const handleDialogClose = async () => {
    setData(JSON.stringify(localStorage));
    setError(false);
    dispatch(setConfig({ dialogLocalStorageViewOpen: false }));
  };

  const handleTextChange = (event) => {
    setError(false);
    setData(event.target.value);
  };

  const handleSave = async () => {
    setError(false);

    if (data.length < 1) {
      setError(true);
      return;
    }

    try {
      JSON.parse(data, (key, value) => {
        if (key !== 'i18nextLng' && key.length > 0 && value.length > 0) {
          localStorage.setItem(key, value.toString());
        }
      });
      await handleDialogClose();
    } catch {
      setError(true);
    }
  };

  const handleOpenConfirm = (value) => {
    setOpenConfirm(value);
  };

  const handleReset = async () => {
    localStorage.clear();
    localStorage.setItem('i18nextLng', i18LngValue);
    setData(JSON.stringify(localStorage));
    handleOpenConfirm(false);
    await handleDialogClose();
  };

  return (
    <>
      <Dialog
        css={userSelectNone}
        open={stateAppScreen.dialogLocalStorageViewOpen}
        onClose={handleDialogClose}
        disableEscapeKeyDown
        aria-labelledby="modal-title"
        aria-describedby="modal-desc"
      >
        <DialogTitle id="modal-title">
          <strong>{t('menu:manage-data')}</strong>
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            css={css`
              margin-bottom: 20px;
            `}
          >
            {t('notice:localstorage-desc')}
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={9}
            value={data}
            onChange={handleTextChange}
            size="small"
            type="text"
            label="LocalStorageData"
            variant="outlined"
            error={error}
            helperText={error ? t('notice:invalid-localstorage') : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => handleOpenConfirm(true)} disabled={error}>
            {t('menu:reset-localstorage')}
          </Button>
          <Button color="primary" variant="contained" onClick={handleSave} disabled={error}>
            {t('menu:save')}
          </Button>
          <Button color="secondary" onClick={handleDialogClose}>
            {t('menu:close')}
          </Button>
        </DialogActions>
      </Dialog>
      <ModalConfirm
        content={t('notice:confirm')}
        open={openConfirm}
        onClose={() => handleOpenConfirm(false)}
        onCancel={() => handleOpenConfirm(false)}
        onOk={handleReset}
      />
    </>
  );
};

export default ModalLocalStorageView;

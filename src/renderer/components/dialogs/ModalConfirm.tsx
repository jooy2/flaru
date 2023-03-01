/** @jsxImportSource @emotion/react */
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import { useTranslation } from 'react-i18next';

import { userSelectNone } from '@/renderer/utils/styles';

const ModalConfirm = ({ open = false, onOk, onCancel, onClose }) => {
  const [t] = useTranslation(['common', 'notice', 'menu']);

  const handleDialogClose = async () => {
    onClose();
  };

  return (
    <Dialog
      css={userSelectNone}
      open={open}
      onClose={handleDialogClose}
      disableEscapeKeyDown
      aria-labelledby="alert-title"
      aria-describedby="alert-desc"
    >
      <DialogContent>
        <DialogContentText id="alert-desc">{t('notice:confirm')}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('menu:cancel')}</Button>
        <Button variant="contained" color="primary" onClick={onOk}>
          {t('menu:ok')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalConfirm;
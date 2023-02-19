/** @jsxImportSource @emotion/react */
import { useDispatch, useSelector } from 'react-redux';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import { useTranslation } from 'react-i18next';
import { css } from '@emotion/react';

import { userSelectNone } from '@/renderer/utils/styles';
import { RootState } from '@/renderer/store';
import { setConfig } from '@/renderer/store/slices/appScreenSlice';

const ModalMetadata = () => {
  const [t] = useTranslation(['common', 'notice', 'menu']);
  const stateAppScreen = useSelector((state: RootState) => state.appScreen);
  const dispatch = useDispatch();

  const handleDialogClose = async () => {
    await dispatch(setConfig({ dialogMetadataOpen: false }));
  };

  return (
    <Dialog
      css={userSelectNone}
      open={stateAppScreen.dialogMetadataOpen}
      onClose={handleDialogClose}
      disableEscapeKeyDown
      aria-labelledby="error-title"
      aria-describedby="error-desc"
    >
      <DialogContent>
        <TableContainer component={Paper}>
          <Table size="small" aria-label="a dense table">
            <TableBody>
              {[
                { name: 'SWF Version', value: stateAppScreen.flashFileSwfVer },
                { name: 'Total Frame', value: stateAppScreen.flashFileFrame },
                { name: 'SWF Frame Rate', value: stateAppScreen.flashFileFrameRate },
                { name: 'SWF Width', value: stateAppScreen.flashFileWidth },
                { name: 'SWF Height', value: stateAppScreen.flashFileHeight },
                { name: 'SWF Background Color', value: stateAppScreen.flashFileBackgroundColor },
              ].map((row) => (
                <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell
                    component="th"
                    scope="row"
                    css={css`
                      background: #525252;
                      color: white;
                      font-weight: bold;
                    `}
                  >
                    {row.name}
                  </TableCell>
                  <TableCell align="right">{row.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose} color="primary">
          {t('menu:close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalMetadata;

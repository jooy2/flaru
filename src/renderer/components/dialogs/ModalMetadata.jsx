/** @jsxImportSource @emotion/react */
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Paper,
  Table,
  TableBody, TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { css } from '@emotion/react';
import * as configActions from '../../store/modules/config';

import { userSelectNone } from '../../utils/styles';

const ModalMetadata = ({ ConfigActions, config }) => {
  const [t] = useTranslation(['common', 'notice', 'menu']);

  const handleDialogClose = async () => {
    await ConfigActions.setConfig({ dialogMetadataOpen: false });
  };

  return (
    <Dialog
      css={userSelectNone}
      open={config.dialogMetadataOpen}
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
                { name: 'SWF Version', value: config.flashFileSwfVer },
                { name: 'Total Frame', value: config.flashFileFrame },
                { name: 'SWF Width', value: config.flashFileWidth },
                { name: 'SWF Height', value: config.flashFileHeight },
                { name: 'SWF Background Color', value: config.flashFileBackgroundColor },
              ].map((row) => (
                <TableRow
                  key={row.name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell
                    component="th"
                    scope="row"
                    css={css`
                      background: #1c1c1c;
                      color: white;
                      font-weight: bold
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
        <Button onClick={e => handleDialogClose(e)} color="primary">
          {t('menu:close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const mapStateToProps = state => ({
  config: state.config,
});

const mapDispatchToProps = dispatch => ({
  ConfigActions: bindActionCreators({ ...configActions }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(ModalMetadata);

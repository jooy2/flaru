import { css } from '@emotion/react';
import { isDarkMode } from './helper';

export const userSelectNone = css`
  user-select: none;
`;

export const marginTopMd = css`
  margin-top: 16px;
`;

export const marginRightXs = css`
  margin-right: 5px;
`;

export const headerArea = css`
  margin-top: 48px;
  flex-shrink: 0;
`;

export const paperSm = css`
  padding: 16px;
  margin-bottom: 16px;
`;

export const paperBase = css`
  text-align: center;
  padding: 32px 16px;
  margin-bottom: 16px;
  max-height: 250px;
  overflow-y: auto;
  p {
    font-size: 1.05em;
  }
`;

export const buttonGroupButtonBase = css`
  border-right: 0 !important;
`;

export const loadingText = props => css`
  font-size: 1.1em;
  margin-top: 20px;
  color: ${isDarkMode(props) ? '#fff' : '#333'}
`;

export default {
  userSelectNone,
  marginTopMd,
  marginRightXs,
  headerArea,
  paperSm,
  paperBase,
  buttonGroupButtonBase,
  loadingText,
};

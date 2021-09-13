import { css } from '@emotion/react';

export const textCenter = css`
  text-align: center;
`;

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
  padding: 16px;
  margin-bottom: 16px;
  max-height: 250px;
  overflow-y: auto;
  p {
    font-size: 0.9em;
  }
`;

export const buttonGroupButtonBase = css`
  border-right: 0 !important;
`;

export default {
  textCenter,
  userSelectNone,
  marginTopMd,
  marginRightXs,
  headerArea,
  paperSm,
  paperBase,
  buttonGroupButtonBase,
};

/** @jsxImportSource @emotion/react */
import Typography from '@mui/material/Typography';

const PanelHeader = ({ title, desc }) => (
  <>
    <Typography component="h3">{title}</Typography>
    <Typography component="span">{desc}</Typography>
  </>
);

export default PanelHeader;

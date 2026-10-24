import { MPButton, MPDialog } from 'material-plus-ui';
import { useTranslation } from 'react-i18next';

export default function ModalConfirm({
  open = false,
  noCancel = false,
  onOk,
  onCancel,
  onClose,
  content,
}: {
  open?: boolean;
  noCancel?: boolean;
  onOk: () => void;
  onCancel: () => void;
  onClose: () => void;
  content: string;
}) {
  const [t] = useTranslation(['common', 'notice', 'menu']);

  return (
    // The question is the whole dialog, so it is set larger than the small line
    // that sits under a title, and it still describes the dialog.
    <MPDialog
      className="app-confirm"
      width={440}
      open={open}
      // The escape key used to be disabled outright; a dismissal now has to go
      // through the buttons instead.
      dismissible={false}
      showClose={false}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      description={content}
      actions={
        <>
          {!noCancel && (
            <MPButton variant="text" onClick={onCancel}>
              {t('menu:cancel')}
            </MPButton>
          )}
          <MPButton variant="filled" color="primary" onClick={onOk}>
            {t('menu:ok')}
          </MPButton>
        </>
      }
    />
  );
}

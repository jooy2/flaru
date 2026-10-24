import { MPContainer } from 'material-plus-ui';
import { ReactNode, useEffect } from 'react';
import Header from '@/renderer/components/layouts/Header';
import ModalAbout from '@/renderer/components/dialogs/ModalAbout';
import ModalMetadata from '@/renderer/components/dialogs/ModalMetadata';
import ModalSettings from '@/renderer/components/dialogs/ModalSettings';

type LayoutProps = {
  title?: string;
  titleTail?: string | null;
  withTail?: boolean;
  withPadding?: boolean;
  header?: boolean;
  container?: boolean;
  center?: boolean;
  withBackButton?: boolean;
  children: ReactNode;
};

export default function Layout({
  title = 'Flare Player',
  titleTail = ' - Flare Flash Player',
  withTail = true,
  header = true,
  container = true,
  center = false,
  withPadding = true,
  withBackButton = false,
  children,
}: LayoutProps) {
  // The window title used to come from `react-helmet-async`. One window, one
  // title, so the document is written to directly.
  useEffect(() => {
    document.title = `${title}${withTail && titleTail ? titleTail : ''}`;
  }, [title, titleTail, withTail]);

  const bodyClassName = [
    'app-body',
    withPadding ? '' : 'app-body--flush',
    center ? 'app-body--center' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const contentClassName = ['app-content', header ? 'app-content--below-header' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="app-shell">
      {header ? <Header title={title} withBackButton={withBackButton} /> : ''}
      <div className={bodyClassName}>
        {container ? (
          <MPContainer>
            <div className={contentClassName}>{children}</div>
          </MPContainer>
        ) : (
          <div className={contentClassName}>{children}</div>
        )}
      </div>
      {/* The dialogs stay with the screen rather than the header, which a
          setting in one of them can hide. */}
      <ModalMetadata />
      <ModalSettings />
      <ModalAbout />
    </div>
  );
}

import { useState } from 'react';
import { EmailPreview } from './EmailPreview';

interface Props {
  htmlContent: string;
}

export function ClientViewTabs({ htmlContent }: Props) {
  const [activeView, setActiveView] = useState<'desktop' | 'mobile' | 'dark'>('desktop');

  const getViewportWidth = () => activeView === 'mobile' ? 375 : 600;
  const isDarkMode = activeView === 'dark';

  return (
    <div>
      <div className="zen-tabs" style={{ marginBottom: '8px' }}>
        <button className={`zen-tab ${activeView === 'desktop' ? 'active' : ''}`} onClick={() => setActiveView('desktop')}>Desktop</button>
        <button className={`zen-tab ${activeView === 'mobile' ? 'active' : ''}`} onClick={() => setActiveView('mobile')}>Mobile</button>
        <button className={`zen-tab ${activeView === 'dark' ? 'active' : ''}`} onClick={() => setActiveView('dark')}>Dark Mode</button>
      </div>
      <EmailPreview htmlContent={htmlContent} viewportWidth={getViewportWidth()} isDarkMode={isDarkMode} />
    </div>
  );
}

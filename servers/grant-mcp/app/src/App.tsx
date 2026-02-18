import { useApp, useHostStyles } from '@modelcontextprotocol/ext-apps/react';
import { useState, useEffect } from 'react';
import type { GrantComplianceData } from './types';
import { OverviewPanel } from './components/OverviewPanel';
import { SectionChecklist } from './components/SectionChecklist';
import { AttachmentsPanel } from './components/AttachmentsPanel';
import { AgencyRequirementsTab } from './components/AgencyRequirementsTab';
import { ComplianceToolbar } from './components/ComplianceToolbar';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { EmptyState } from './components/EmptyState';

type TabName = 'checker' | 'requirements';

export default function App() {
  const app = useApp();
  const hostStyles = useHostStyles();
  const [data, setData] = useState<GrantComplianceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabName>('checker');

  useEffect(() => {
    app.ontoolresult = (result) => {
      try {
        const parsed = JSON.parse(result.content[0].text) as GrantComplianceData;
        setData(parsed);
        setError(null);
      } catch {
        setError('Failed to parse tool result');
      }
      setLoading(false);
    };
  }, [app]);

  const handleAgencyChange = async (agency: string) => {
    try {
      await app.callServerTool({
        name: 'generate_proposal',
        arguments: { sections: [], funder: agency, programType: 'standard' },
      });
    } catch (e) {
      console.error('Agency change failed:', e);
    }
  };

  const handleRecheck = async () => {
    if (!data) return;
    try {
      await app.callServerTool({
        name: 'validate_compliance',
        arguments: { sections: [], funder: data.metadata.funder, programType: data.metadata.program_type },
      });
    } catch (e) {
      console.error('Re-check failed:', e);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState />;

  return (
    <div style={{ ...hostStyles, padding: '16px', fontFamily: 'var(--zen-font-sans)' }}>
      <ComplianceToolbar data={data} onAgencyChange={handleAgencyChange} onRecheck={handleRecheck} />

      <div className="zen-tabs">
        <button className={`zen-tab ${activeTab === 'checker' ? 'active' : ''}`} onClick={() => setActiveTab('checker')}>
          Compliance Checker
        </button>
        <button className={`zen-tab ${activeTab === 'requirements' ? 'active' : ''}`} onClick={() => setActiveTab('requirements')}>
          Agency Requirements
        </button>
      </div>

      {activeTab === 'checker' && (
        <>
          <OverviewPanel data={data} />
          <SectionChecklist sections={data.metadata.sections} />
          <AttachmentsPanel attachments={data.metadata.attachments} />
        </>
      )}

      {activeTab === 'requirements' && (
        <AgencyRequirementsTab funder={data.metadata.funder} />
      )}
    </div>
  );
}

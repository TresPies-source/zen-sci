interface Props {
  funder: string;
}

const FUNDER_RULES: Record<string, { program: string; pageLimit: number; fontMin: number; marginMin: number; platform: string; sections: string[] }> = {
  nih: { program: 'NIH R01', pageLimit: 12, fontMin: 10, marginMin: 0.5, platform: 'nih-era-commons', sections: ['Specific Aims', 'Research Plan', 'Budget Justification', 'References'] },
  nsf: { program: 'NSF Standard', pageLimit: 15, fontMin: 10, marginMin: 1.0, platform: 'nsf-research-gov', sections: ['Project Summary', 'Project Description', 'References Cited', 'Budget Justification'] },
  erc: { program: 'ERC Starting', pageLimit: 12, fontMin: 11, marginMin: 1.0, platform: 'erc-sygma', sections: ['Excellence', 'Impact', 'Implementation', 'References'] },
};

export function AgencyRequirementsTab({ funder }: Props) {
  const rules = FUNDER_RULES[funder] || FUNDER_RULES.nih;

  return (
    <div style={{ marginTop: '16px', padding: '16px', background: 'var(--mcp-bg-secondary, #f9f9f9)', borderRadius: 'var(--zen-radius)' }}>
      <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>{rules.program} Requirements</h3>
      <table className="zen-meta-table">
        <tbody>
          <tr><td>Page Limit</td><td>{rules.pageLimit} pages</td></tr>
          <tr><td>Minimum Font Size</td><td>{rules.fontMin} pt</td></tr>
          <tr><td>Minimum Margins</td><td>{rules.marginMin}" all sides</td></tr>
          <tr><td>Submission Platform</td><td style={{ fontFamily: 'var(--zen-font-mono)' }}>{rules.platform}</td></tr>
          <tr><td>Required Sections</td><td><ul style={{ margin: 0, paddingLeft: '20px' }}>{rules.sections.map((s, i) => <li key={i}>{s}</li>)}</ul></td></tr>
        </tbody>
      </table>
    </div>
  );
}

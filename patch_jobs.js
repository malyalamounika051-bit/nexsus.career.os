const fs = require('fs');

const file = './frontend/src/pages/Jobs.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
content = content.replace(
  "import { jobService } from '../services/adviceService';",
  "import { jobService } from '../services/adviceService';\nimport { resumeService } from '../services/resumeService';"
);

content = content.replace(
  "TrendingUp, Star\n} from 'lucide-react';",
  "TrendingUp, Star, UploadCloud, FileText, Cpu, AlertTriangle\n} from 'lucide-react';"
);

// 2. Add State variables inside JobsPage
const stateTarget = "const [fitLoading, setFitLoading] = useState(false);";
const stateAdditions = `
  // AI Match State
  const [isMatchMode, setIsMatchMode] = useState(false);
  const [userResumes, setUserResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
`;
content = content.replace(stateTarget, stateTarget + "\n" + stateAdditions);

// 3. Update useEffect
const useEffectTarget = "fetchSavedJobs();";
const useEffectAdditions = `
    fetchUserResumes();`;
content = content.replace(useEffectTarget, useEffectTarget + useEffectAdditions);

// 4. Add fetchUserResumes function
const fetchSavedJobsTarget = "const fetchSavedJobs = async () => {";
const fetchResumesCode = `
  const fetchUserResumes = async () => {
    try {
      const { data } = await resumeService.getAll();
      if (data && data.data) setUserResumes(data.data);
    } catch (err) { console.error('Failed to fetch resumes', err); }
  };

  `;
content = content.replace(fetchSavedJobsTarget, fetchResumesCode + fetchSavedJobsTarget);

// 5. Update handleSearch to use aiMatchJobs
const handleSearchTarget = `const { data } = await jobService.searchJobs({
        role: searchRole.trim(),
        location: searchLocation.trim(),
        isRemote,
        isInternship
      });`;
const newHandleSearch = `let data;
      if (isMatchMode && (selectedResumeId || resumeFile)) {
        const formData = new FormData();
        formData.append('role', searchRole.trim());
        formData.append('location', searchLocation.trim());
        formData.append('isRemote', isRemote);
        formData.append('isInternship', isInternship);
        if (resumeFile) formData.append('resumeFile', resumeFile);
        if (selectedResumeId) formData.append('resumeId', selectedResumeId);
        
        const res = await jobService.aiMatchJobs(formData);
        data = res.data;
      } else {
        const res = await jobService.searchJobs({
          role: searchRole.trim(),
          location: searchLocation.trim(),
          isRemote,
          isInternship
        });
        data = res.data;
      }`;
content = content.replace(handleSearchTarget, newHandleSearch);

// 6. Update Form UI to include AI Match Mode toggles
const formTopTarget = `<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>`;
const formAdditions = `
            {/* AI Match Toggle */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: isMatchMode ? 'rgba(168, 85, 247, 0.05)' : 'var(--color-surface)', borderRadius: '12px', border: isMatchMode ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid var(--color-border)', transition: 'all 0.3s' }}>
               <button type="button" onClick={() => setIsMatchMode(!isMatchMode)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: isMatchMode ? '#a855f7' : 'var(--color-text-muted)', fontWeight: 700, fontSize: '0.9rem' }}>
                  <Cpu size={20} /> AI Match Mode
               </button>
               
               {isMatchMode && (
                 <div style={{ display: 'flex', flex: 1, gap: '1rem', alignItems: 'center', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}>
                    <select value={selectedResumeId} onChange={e => { setSelectedResumeId(e.target.value); setResumeFile(null); }} style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', outline: 'none' }}>
                      <option value="">Select a saved resume...</option>
                      {userResumes.map(r => <option key={r._id} value={r._id}>{r.resumeTitle}</option>)}
                    </select>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>OR</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--color-text-dim)', background: 'var(--color-surface-2)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                      <UploadCloud size={16} /> {resumeFile ? resumeFile.name : 'Upload PDF'}
                      <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { if(e.target.files[0]) { setResumeFile(e.target.files[0]); setSelectedResumeId(''); } }} />
                    </label>
                 </div>
               )}
            </div>

            `;
content = content.replace(formTopTarget, formAdditions + formTopTarget);

// 7. Update JobCard to show matchScore and reasonFit
const jobCardTitleTarget = `<h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.3, marginBottom: '0.25rem' }}>
              {job.title}
            </h3>`;
const matchScoreInjection = `
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.3, marginBottom: '0.25rem' }}>
                {job.title}
              </h3>
              {job.matchScore !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', border: \`3px solid \${job.matchScore >= 80 ? '#10b981' : job.matchScore >= 50 ? '#fbbf24' : '#fca5a5'}\`, fontWeight: 800, fontSize: '0.75rem', background: 'var(--color-surface-2)' }}>
                  {job.matchScore}%
                </div>
              )}
            </div>`;
content = content.replace(jobCardTitleTarget, matchScoreInjection);

const jobCardFooterTarget = `<div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>`;
const aiReasonInjection = `
        {job.reasonFit && (
          <div style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#a855f7', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              <Sparkles size={12} /> AI Insight
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', lineHeight: 1.4, margin: 0 }}>{job.reasonFit}</p>
            {job.missingSkills && job.missingSkills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><AlertTriangle size={12}/> Missing:</span>
                {job.missingSkills.map((s, i) => <span key={i} style={{ background: 'rgba(252, 165, 165, 0.1)', color: '#fca5a5', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{s}</span>)}
              </div>
            )}
          </div>
        )}
`;
content = content.replace(jobCardFooterTarget, aiReasonInjection + jobCardFooterTarget);

fs.writeFileSync(file, content);
console.log('Jobs.jsx successfully patched for AI Match features.');

import { useEffect, useMemo, useState } from 'react';
import { pdfjs } from 'react-pdf';
import mammoth from 'mammoth';
import { FiAlertCircle, FiCheckCircle, FiFileText, FiLoader, FiUploadCloud, FiBookOpen, FiExternalLink, FiCpu, FiCloud } from 'react-icons/fi';
import { getFirestore, collection, addDoc, query, where, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { firebaseApp, auth } from '../firebase';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

const db = getFirestore(firebaseApp);
const SKILLS = ['react','next.js','javascript','typescript','html','css','tailwind','vite','node.js','node js','express','python','java','c++','django','flask','spring','mongodb','mysql','postgresql','sql','firebase','aws','azure','docker','kubernetes','git','github','figma','pytorch','tensorflow','scikit-learn','pandas','numpy','machine learning','deep learning','nlp','llm','rest api'];

async function extractText(file) {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    let text = '';
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(' ') + '\n';
    }
    return { text, pageCount: pdf.numPages };
  }
  if (file.name.toLowerCase().endsWith('.docx')) {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return { text: result.value, pageCount: null };
  }
  throw new Error('Only PDF and DOCX files are supported.');
}

async function saveAnalysis(result, fileName, text, provider) {
  if (!auth.currentUser) return;
  await addDoc(collection(db, 'resumeAnalyses'), { uid: auth.currentUser.uid, fileName, provider, textLength: text.length, result, createdAt: serverTimestamp() });
}

export default function ResumeAnalyzer({ onExtractedData }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState(() => localStorage.getItem('kairos-ai-provider') || 'gemini');
  const [providers, setProviders] = useState({ gemini: { configured: false }, local: { available: false } });
  const [providerLoading, setProviderLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadProviders = async () => {
      setProviderLoading(true);
      try {
        const apiBase = (import.meta.env.VITE_AI_API_URL || '').replace(/\/$/, '');
        const response = await fetch(apiBase + '/api/providers');
        const data = await response.json();
        if (!cancelled) {
          setProviders(data);
          const currentAvailable = provider === 'local' ? data.local?.available : data.gemini?.configured;
          if (!currentAvailable) {
            const fallback = data.gemini?.configured ? 'gemini' : data.local?.available ? 'local' : provider;
            setProvider(fallback);
            localStorage.setItem('kairos-ai-provider', fallback);
          }
        }
      } catch (err) {
        if (!cancelled) setError('AI service is not reachable. Start the Kairos AI server or configure VITE_AI_API_URL.');
      } finally {
        if (!cancelled) setProviderLoading(false);
      }
    };
    loadProviders();
    return () => { cancelled = true; };
  }, []);

  const chooseProvider = (value) => {
    setProvider(value);
    localStorage.setItem('kairos-ai-provider', value);
    setError('');
  };

  const scoreLabel = useMemo(() => {
    if (!result) return '';
    if (result.score >= 80) return 'Strong';
    if (result.score >= 65) return 'Good';
    if (result.score >= 50) return 'Needs work';
    return 'Early draft';
  }, [result]);

  const loadHistory = async () => {
    if (!auth.currentUser) return;
    try {
      const snapshot = await getDocs(query(collection(db, 'resumeAnalyses'), where('uid', '==', auth.currentUser.uid), limit(5)));
      const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setHistory(items);
    } catch (err) {
      console.warn('Resume history unavailable:', err);
    }
  };

  const analyze = async (selectedFile) => {
    setLoading(true);
    setError('');

    try {
      const extracted = await extractText(selectedFile);
      const text = extracted.text.trim();

      if (text.length < 50) {
        throw new Error('The file does not contain enough readable text. If this is a scanned PDF, use a text-based PDF or DOCX.');
      }
      if (text.length > 120000) {
        throw new Error('This resume contains too much text to analyze. Please use a shorter resume.');
      }

      const apiBase = (import.meta.env.VITE_AI_API_URL || '').replace(/\/$/, '');
      const headers = { 'Content-Type': 'application/json' };

      if (auth.currentUser) {
        headers.Authorization = 'Bearer ' + await auth.currentUser.getIdToken();
      }

      const response = await fetch(apiBase + '/api/analyze-resume', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          file_name: selectedFile.name,
          page_count: extracted.pageCount,
          provider
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || 'The selected AI provider could not analyze the resume.');
      if (!payload.mode) throw new Error('The AI service returned an invalid analysis.');

      setResult(payload);

      try {
        await saveAnalysis(payload, selectedFile.name, text, provider);
        await loadHistory();
      } catch (saveError) {
        console.error('Could not save resume analysis:', saveError);
      }

      if (onExtractedData) onExtractedData(payload);
    } catch (err) {
      console.error(err);
      setResult(null);
      setError(err.message || 'Unable to analyze this resume.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (event) => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;

    const validType = selected.name.toLowerCase().endsWith('.pdf') || selected.name.toLowerCase().endsWith('.docx');
    if (!validType) {
      setError('Only PDF and DOCX files are supported.');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError('Please choose a resume smaller than 5 MB.');
      return;
    }

    setFile(selected);
    setResult(null);
    await analyze(selected);
  };

  return (
    <div className="resume-ai">
      <div className="resume-ai-header">
        <div>
          <p className="eyebrow">AI RESUME REVIEW</p>
          <h2>Turn your resume into a career plan.</h2>
          <p>Upload a PDF or DOCX and choose whether Gemini or your local Ollama model performs the analysis.</p>
        </div>
        <div className="resume-ai-icon"><FiFileText /></div>
      </div>

      <div className="ai-provider-picker">
        <div className="provider-heading">
          <div>
            <p className="eyebrow">ANALYSIS ENGINE</p>
            <h3>Choose how Kairos analyzes your resume</h3>
          </div>
          {providerLoading && <span className="provider-checking"><FiLoader className="spin" /> Checking availability</span>}
        </div>
        <div className="provider-options">
          <button type="button" className={provider === 'gemini' ? 'provider-option active' : 'provider-option'} onClick={() => chooseProvider('gemini')} disabled={loading || (!providerLoading && !providers.gemini?.configured)}>
            <span className="provider-icon"><FiCloud /></span>
            <span><strong>Gemini AI</strong><small>{providers.gemini?.configured ? 'Cloud analysis · configured' : 'Not configured on the AI server'}</small></span>
            <span className="provider-radio">{provider === 'gemini' ? '✓' : ''}</span>
          </button>
          <button type="button" className={provider === 'local' ? 'provider-option active' : 'provider-option'} onClick={() => chooseProvider('local')} disabled={loading || (!providerLoading && !providers.local?.available)}>
            <span className="provider-icon"><FiCpu /></span>
            <span><strong>Local model</strong><small>{providers.local?.available ? 'Ollama · ' + (providers.local.model || 'configured model') : providers.local?.server_available ? 'Ollama is running, but the selected model is not installed' : 'Ollama is not reachable'}</small></span>
            <span className="provider-radio">{provider === 'local' ? '✓' : ''}</span>
          </button>
        </div>
        <p className="provider-note">{provider === 'local' ? 'Local mode keeps resume text on your configured AI server and uses its Ollama model. It must be running before analysis.' : 'Gemini sends the extracted resume text to Google’s Gemini API for analysis.'}</p>
      </div>

      <label className="resume-dropzone">
        <FiUploadCloud size={28} />
        <strong>{loading ? 'Analyzing resume…' : 'Choose a PDF or DOCX'}</strong>
        <span>{file ? file.name : 'Text-based resumes work best'}</span>
        <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleChange} disabled={loading} />
      </label>

      {loading && <div className="resume-status"><FiLoader className="spin" /> Extracting and analyzing your resume...</div>}
      {error && <div className="resume-error"><FiAlertCircle />{error}</div>}

      {result && (
        <div className="resume-results">
          <div className="resume-score-card">
            <div className="score-ring" style={{ '--score': `${Math.max(0, Math.min(100, Number(result.score) || 0))}%` }}><strong>{result.score}</strong><span>/100</span></div>
            <div><p className="eyebrow">{result.mode === 'gemini' ? 'GEMINI AI ANALYSIS' : 'LOCAL MODEL ANALYSIS'}</p><h3>{scoreLabel}</h3><p>{result.summary}</p></div>
          </div>

          {result.contact && (result.contact.email || result.contact.phone) && <section className="resume-contact"><p className="eyebrow">CONTACT FOUND</p><div className="contact-chips">{result.contact.email && <span>{result.contact.email}</span>}{result.contact.phone && <span>{result.contact.phone}</span>}</div></section>}

          <div className="resume-result-grid">
            <section><p className="eyebrow">CAREER DIRECTION</p><h3>{result.career_field}</h3>{result.candidate_level && <p className="result-meta">Candidate level: <strong>{result.candidate_level}</strong></p>}<div className="chip-list">{(result.recommended_roles || []).map((role) => <span key={role}>{role}</span>)}</div></section>
            <section><p className="eyebrow">DETECTED SKILLS</p><div className="chip-list">{(result.skills || []).map((skill) => <span key={skill}>{skill}</span>)}</div></section>
            <section><p className="eyebrow">RECOMMENDED SKILLS</p><div className="chip-list">{(result.recommended_skills || []).slice(0,12).map((skill) => <span key={skill}>{skill}</span>)}</div></section>
            <section><p className="eyebrow">WHAT IS WORKING</p>{(result.strengths || []).map((item) => <p className="result-line" key={item}><FiCheckCircle />{item}</p>)}</section>
            <section><p className="eyebrow">NEXT IMPROVEMENTS</p>{(result.improvements || []).map((item) => <p className="result-line" key={item}><FiAlertCircle />{item}</p>)}</section>
            <section><p className="eyebrow">MISSING / REVIEW SECTIONS</p><div className="chip-list">{(result.missing_sections || []).map((item) => <span key={item}>{item}</span>)}</div></section>
          </div>

          {(result.recommended_courses || []).length > 0 && <section className="resume-section"><p className="eyebrow"><FiBookOpen /> LEARNING RECOMMENDATIONS</p><div className="course-grid">{result.recommended_courses.slice(0,5).map((course) => <a className="course-card" href={course.url} target="_blank" rel="noreferrer" key={course.title}><span>{course.title}</span><FiExternalLink /></a>)}</div></section>}
          {(result.resume_videos || []).length > 0 && <section className="resume-section"><p className="eyebrow">RESUME & INTERVIEW VIDEOS</p><div className="course-grid">{result.resume_videos.slice(0,3).map((url, index) => <a className="course-card" href={url} target="_blank" rel="noreferrer" key={url}><span>Resume preparation video {index + 1}</span><FiExternalLink /></a>)}{(result.interview_videos || []).slice(0,2).map((url, index) => <a className="course-card" href={url} target="_blank" rel="noreferrer" key={url}><span>Interview preparation video {index + 1}</span><FiExternalLink /></a>)}</div></section>}

          {(result.resume_tips || []).length > 0 && <section className="resume-section"><p className="eyebrow">SMART RESUME TIPS</p>{result.resume_tips.map((tip) => <p className="result-line" key={tip}><FiCheckCircle />{tip}</p>)}</section>}

          <section className="resume-section"><p className="eyebrow">INTERVIEW PREP</p>{(result.questions || []).map((question) => <div className="question-row" key={question}>{question}</div>)}</section>
        </div>
      )}

      {history.length > 0 && <section className="resume-history"><p className="eyebrow">RECENT ANALYSES</p>{history.map((item) => <button key={item.id} onClick={() => setResult(item.result)}>{item.fileName}<span>{item.result?.score ?? '--'}/100</span></button>)}</section>}
    </div>
  );
}

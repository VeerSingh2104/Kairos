import { useMemo, useState } from 'react';
import { pdfjs } from 'react-pdf';
import mammoth from 'mammoth';
import { FiAlertCircle, FiCheckCircle, FiFileText, FiLoader, FiUploadCloud, FiBookOpen, FiExternalLink } from 'react-icons/fi';
import { getFirestore, collection, addDoc, query, where, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { firebaseApp, auth } from '../firebase';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

const db = getFirestore(firebaseApp);
const SKILLS = ['react','next.js','javascript','typescript','html','css','tailwind','vite','node.js','node js','express','python','java','c++','django','flask','spring','mongodb','mysql','postgresql','sql','firebase','aws','azure','docker','kubernetes','git','github','figma','pytorch','tensorflow','scikit-learn','pandas','numpy','machine learning','deep learning','nlp','llm','rest api'];

function localAnalysis(text) {
  const lower = text.toLowerCase();
  const skills = SKILLS.filter((skill) => lower.includes(skill));
  const sections = {
    experience: /experience|employment|internship/.test(lower),
    education: /education|university|college|degree|b.tech|bachelor/.test(lower),
    projects: /projects|portfolio|github/.test(lower),
    skills: /skills|technologies|technical/.test(lower)
  };
  const score = Math.min(100, 35 + Object.values(sections).filter(Boolean).length * 10 + Math.min(skills.length * 2, 20) + Math.min(Math.round(text.length / 300), 15));
  const improvements = [];
  if (!sections.experience) improvements.push('Add internship, work, research, freelance, or leadership experience.');
  if (!sections.projects) improvements.push('Add 2–3 projects with technologies, your contribution, and measurable outcomes.');
  if (!sections.skills) improvements.push('Add a clearly grouped technical skills section.');
  if (!/\d+%|\d+ users|\d+ ms|\d+ projects|\d+ years/.test(lower)) improvements.push('Quantify impact using metrics such as %, users, latency, scale, or time saved.');
  let field = 'Software Engineering';
  if (/machine learning|deep learning|tensorflow|pytorch|nlp|llm/.test(lower)) field = 'AI / Machine Learning';
  else if (/data analyst|data analysis|power bi|tableau/.test(lower)) field = 'Data & Analytics';
  else if (/figma|ui\/ux|user research/.test(lower)) field = 'UI/UX & Product Design';
  return {
    mode: 'local', score, career_field: field,
    summary: 'The resume was parsed locally. Uploading to the Kairos AI service enables the hybrid analyzer.',
    skills, strengths: [skills.length ? 'Technical keywords were detected.' : 'The resume text is readable.', sections.projects ? 'Projects are present.' : 'Projects should be made easier to locate.', sections.education ? 'Education information is detectable.' : 'Education details should be made easier to locate.'],
    improvements: improvements.slice(0, 5), ats_keywords: skills.slice(0, 12),
    missing_sections: Object.entries(sections).filter(([, present]) => !present).map(([name]) => name),
    recommended_roles: [field, 'Software Engineer', 'Full Stack Developer'],
    questions: ['Walk through your strongest project and explain the engineering decisions you made.', 'Which technology on your resume are you most confident using independently?', 'Describe a difficult bug or problem you solved.'],
    recommended_skills: [], recommended_courses: [], resume_tips: []
  };
}

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

async function saveAnalysis(result, fileName, text) {
  if (!auth.currentUser) return;
  await addDoc(collection(db, 'resumeAnalyses'), { uid: auth.currentUser.uid, fileName, textLength: text.length, result, createdAt: serverTimestamp() });
}

export default function ResumeAnalyzer({ onExtractedData }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const text = extracted.text;
      if (text.trim().length < 50) throw new Error('The file does not contain enough readable text. If this is a scanned PDF, use a text-based PDF or DOCX.');

      let analysis = localAnalysis(text);
      try {
        const apiBase = import.meta.env.VITE_AI_API_URL || '';
        const response = await fetch(apiBase + '/api/analyze-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, file_name: selectedFile.name, page_count: extracted.pageCount })
        });
        const remote = await response.json().catch(() => ({}));
        if (response.ok && remote.mode) {
          analysis = remote;
          if (remote.mode === 'legacy') setError('Gemini was unavailable, so Kairos used the Smart Resume Analyser engine as a fallback.');
        } else {
          setError('Resume AI service failed. Showing the local analyzer instead.');
        }
      } catch (apiError) {
        console.info('AI service unavailable; using local resume analysis.', apiError);
        setError('AI service could not be reached. Showing local analysis instead.');
      }

      setResult(analysis);
      try {
        await saveAnalysis(analysis, selectedFile.name, text);
        await loadHistory();
      } catch (saveError) {
        console.error('Could not save resume analysis:', saveError);
      }
      if (onExtractedData) onExtractedData({ skills: analysis.skills || [] });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to analyze this resume.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
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
          <p>Upload a PDF or DOCX. Kairos combines the original Smart Resume Analyser engine with Gemini AI for deeper feedback.</p>
        </div>
        <div className="resume-ai-icon"><FiFileText /></div>
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
            <div><p className="eyebrow">{result.mode === 'hybrid' ? 'HYBRID AI + SMART ANALYZER' : result.mode === 'legacy' ? 'SMART RESUME ANALYSIS' : 'LOCAL RESUME ANALYSIS'}</p><h3>{scoreLabel}</h3><p>{result.summary}</p></div>
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

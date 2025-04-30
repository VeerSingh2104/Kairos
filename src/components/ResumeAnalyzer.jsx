import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import mammoth from 'mammoth';

// Set workerSrc for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

// Keyword lists for skill matching
const dsKeywords = ['tensorflow', 'keras', 'pytorch', 'machine learning', 'deep learning', 'flask', 'streamlit'];
const webKeywords = ['react', 'django', 'node js', 'react js', 'php', 'laravel', 'magento', 'wordpress', 'javascript', 'angular js', 'c#', 'flask'];
const androidKeywords = ['android', 'android development', 'flutter', 'kotlin', 'xml', 'kivy'];
const iosKeywords = ['ios', 'ios development', 'swift', 'cocoa', 'cocoa touch', 'xcode'];
const uiuxKeywords = ['ux', 'adobe xd', 'figma', 'zeplin', 'balsamiq', 'ui', 'prototyping', 'wireframes', 'storyframes', 'adobe photoshop', 'photoshop', 'editing', 'adobe illustrator', 'illustrator', 'adobe after effects', 'after effects', 'adobe premier pro', 'premier pro', 'adobe indesign', 'indesign', 'wireframe', 'solid', 'grasp', 'user research', 'user experience'];

function ResumeAnalyzer({ onExtractedData }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  // Extract text from PDF using pdfjs
  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      fullText += strings.join(' ') + ' ';
    }
    return fullText;
  };

  // Extract text from DOCX using mammoth
  const extractTextFromDocx = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      setPdfFile(file);
      const text = await extractTextFromPDF(file);
      setTextContent(text);
      analyzeResume(text);
      if (onExtractedData) onExtractedData(parseKeywordsToFormData(text));
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      const text = await extractTextFromDocx(file);
      setPdfFile(null);
      setTextContent(text);
      analyzeResume(text);
      if (onExtractedData) onExtractedData(parseKeywordsToFormData(text));
    } else {
      alert('Please upload a PDF or DOCX file.');
    }
  };

  // Analyze resume text for skills and recommendations
  const analyzeResume = (text) => {
    const lowerText = text.toLowerCase();
    let recoField = '';
    let recommendedSkills = [];
    let recommendedCourses = [];

    const checkKeywords = (keywords, field, skills, courses) => {
      for (const kw of keywords) {
        if (lowerText.includes(kw)) {
          recoField = field;
          recommendedSkills = skills;
          recommendedCourses = courses;
          return true;
        }
      }
      return false;
    };

    // Example course lists (can be replaced with actual data or API)
    const dsCourses = ['Machine Learning Crash Course by Google', 'Machine Learning A-Z by Udemy'];
    const webCourses = ['React - The Complete Guide', 'Django for Beginners'];
    const androidCourses = ['Android Development for Beginners', 'Flutter & Dart - The Complete Guide'];
    const iosCourses = ['iOS App Development with Swift', 'Advanced iOS Development'];
    const uiuxCourses = ['UI/UX Design Fundamentals', 'Advanced Prototyping Techniques'];

    if (checkKeywords(dsKeywords, 'Data Science', ['Data Visualization', 'Predictive Analysis', 'Statistical Modeling', 'Data Mining'], dsCourses)) {
      // matched Data Science
    } else if (checkKeywords(webKeywords, 'Web Development', ['React', 'Django', 'Node JS', 'PHP'], webCourses)) {
      // matched Web Development
    } else if (checkKeywords(androidKeywords, 'Android Development', ['Android', 'Flutter', 'Kotlin'], androidCourses)) {
      // matched Android
    } else if (checkKeywords(iosKeywords, 'iOS Development', ['iOS', 'Swift', 'Xcode'], iosCourses)) {
      // matched iOS
    } else if (checkKeywords(uiuxKeywords, 'UI/UX Development', ['UI', 'User Experience', 'Adobe XD'], uiuxCourses)) {
      // matched UI/UX
    } else {
      recoField = 'General';
      recommendedSkills = ['Communication', 'Teamwork', 'Problem Solving'];
      recommendedCourses = ['Effective Communication', 'Teamwork Skills'];
    }

    // Simple scoring based on presence of keywords
    let score = 0;
    const keywordsAll = [...dsKeywords, ...webKeywords, ...androidKeywords, ...iosKeywords, ...uiuxKeywords];
    keywordsAll.forEach(kw => {
      if (lowerText.includes(kw)) score += 1;
    });
    if (score > 20) score = 20; // cap score

    setAnalysisResult({
      recoField,
      recommendedSkills,
      recommendedCourses,
      score
    });
  };

  // Parse keywords from text to autofill form data structure
  const parseKeywordsToFormData = (text) => {
    const lowerText = text.toLowerCase();
    const formData = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      education: [{ institution: '', degree: '', year: '' }],
      experience: [{ company: '', position: '', duration: '' }],
      skills: []
    };

    // Simple heuristic: extract skills found in text
    const allKeywords = [...dsKeywords, ...webKeywords, ...androidKeywords, ...iosKeywords, ...uiuxKeywords];
    const foundSkills = allKeywords.filter(kw => lowerText.includes(kw));
    formData.skills = foundSkills.length > 0 ? foundSkills : [''];

    return formData;
  };

  return (
    <div className="resume-analyzer">
      <h2>Resume Analyzer</h2>
      <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} />
      {pdfFile && (
        <div>
          <p>Uploaded file: {pdfFile.name}</p>
        </div>
      )}
      {analysisResult && (
        <div className="analysis-result">
          <h3>Analysis Result</h3>
          <p><strong>Recommended Field:</strong> {analysisResult.recoField}</p>
          <p><strong>Recommended Skills:</strong> {analysisResult.recommendedSkills.join(', ')}</p>
          <p><strong>Recommended Courses:</strong> {analysisResult.recommendedCourses.join(', ')}</p>
          <p><strong>Resume Score:</strong> {analysisResult.score} / 20</p>
        </div>
      )}
    </div>
  );
}

export default ResumeAnalyzer;

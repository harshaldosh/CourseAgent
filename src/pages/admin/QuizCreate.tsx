import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Wand2, Settings, AlertTriangle, Info } from 'lucide-react';
import { quizService } from '../../services/quiz';
import { llmConfigService } from '../../services/llm-config';
import type { QuizFormData, QuizQuestion } from '../../types/quiz';
import FileUpload from '../../components/FileUpload';
import LLMConfigModal from '../../components/LLMConfigModal';
import toast from 'react-hot-toast';

const QuizCreate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showLLMConfig, setShowLLMConfig] = useState(false);
  const [formData, setFormData] = useState<QuizFormData>({
    title: '',
    description: '',
    topic: '',
    totalQuestions: 10,
    totalMarks: 100,
    evaluationPrompts: []
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [newPrompt, setNewPrompt] = useState('');
  const [generationMethod, setGenerationMethod] = useState<'topic' | 'pdf'>('topic');

  const currentLLMConfig = llmConfigService.getCurrentConfig();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalQuestions' || name === 'totalMarks' ? parseInt(value) || 0 : value
    }));
  };

  const addEvaluationPrompt = () => {
    if (newPrompt.trim()) {
      setFormData(prev => ({
        ...prev,
        evaluationPrompts: [...prev.evaluationPrompts, newPrompt.trim()]
      }));
      setNewPrompt('');
    }
  };

  const removeEvaluationPrompt = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evaluationPrompts: prev.evaluationPrompts.filter((_, i) => i !== index)
    }));
  };

  const generateQuestions = async () => {
    // Validation
    if (generationMethod === 'topic' && !formData.topic.trim()) {
      toast.error('Please enter a topic for quiz generation');
      return;
    }

    if (generationMethod === 'pdf' && !pdfFile) {
      toast.error('Please upload a PDF file for quiz generation');
      return;
    }

    if (!formData.totalQuestions || formData.totalQuestions < 1 || formData.totalQuestions > 50) {
      toast.error('Please enter a valid number of questions (1-50)');
      return;
    }

    // Check LLM configuration
    const config = llmConfigService.getCurrentConfig();
    if (!config.apiKey && config.provider !== 'openai') {
      toast.error('Please configure your LLM provider first. You may also need to set up API keys in your Supabase project settings.');
      setShowLLMConfig(true);
      return;
    }

    setGenerating(true);
    
    try {
      let generatedQuestions: QuizQuestion[];
      
      if (generationMethod === 'pdf' && pdfFile) {
        generatedQuestions = await quizService.generateQuizFromPDF(
          pdfFile,
          formData.topic,
          formData.totalQuestions
        );
      } else {
        generatedQuestions = await quizService.generateQuizFromTopic(
          formData.topic,
          formData.totalQuestions
        );
      }

      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error('No questions were generated. Please try again with different parameters.');
      }

      setQuestions(generatedQuestions);
      toast.success(`Successfully generated ${generatedQuestions.length} questions!`);
      
    } catch (error) {
      console.error('Failed to generate questions:', error);
      
      // Enhanced error handling with specific messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('API error') || errorMessage.includes('401') || errorMessage.includes('403')) {
        toast.error('Authentication failed with LLM provider. Please check that your API keys are properly configured in Supabase project settings.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        toast.error('Network error occurred. Please check your internet connection and try again.');
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        toast.error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
        toast.error('Invalid response from AI service. Please try again or contact support.');
      } else if (errorMessage.includes('Edge Function')) {
        toast.error('Quiz generation service is not available. Please ensure Supabase Edge Functions are properly deployed.');
      } else {
        toast.error(`Failed to generate questions: ${errorMessage}`);
      }
    } finally {
      setGenerating(false);
    }
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: crypto.randomUUID(),
      question: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 10
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }

    if (questions.length === 0) {
      toast.error('Please generate or add questions to the quiz');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.question.trim()) {
        toast.error(`Question ${i + 1} is missing question text`);
        return;
      }
      
      if (question.type === 'multiple-choice') {
        if (!question.options || question.options.some(opt => !opt.trim())) {
          toast.error(`Question ${i + 1} has empty multiple-choice options`);
          return;
        }
        
        if (!question.correctAnswer) {
          toast.error(`Question ${i + 1} is missing the correct answer`);
          return;
        }
      }
      
      if (!question.marks || question.marks < 1) {
        toast.error(`Question ${i + 1} must have at least 1 mark`);
        return;
      }
    }

    setLoading(true);
    
    try {
      const quizData = {
        ...formData,
        pdfFile: generationMethod === 'pdf' ? pdfFile : undefined
      };
      
      await quizService.createQuiz(quizData, questions); //harshal
      toast.success('Quiz created successfully!');
      navigate('/admin/quizzes');
      
    } catch (error) {
      console.error('Failed to create quiz:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('permission denied') || errorMessage.includes('403')) {
        toast.error('Permission denied. Please ensure you have admin privileges and are properly authenticated.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Network error occurred. Please check your connection and try again.');
      } else {
        toast.error(`Failed to create quiz: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/quizzes')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Quiz</h1>
            <p className="text-gray-600 mt-2">Generate quiz questions from topic or PDF document</p>
          </div>
        </div>

        <button
          onClick={() => setShowLLMConfig(true)}
          className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Settings className="w-4 h-4 mr-2" />
          LLM Config
        </button>
      </div>

      {/* LLM Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Info className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Current LLM Provider</h3>
              <p className="text-sm text-blue-700">
                {currentLLMConfig.provider.toUpperCase()} - {currentLLMConfig.model}
                {!currentLLMConfig.apiKey && currentLLMConfig.provider !== 'openai' && (
                  <span className="text-red-600 ml-2 font-medium">(API key not configured)</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLLMConfig(true)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Configure
          </button>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Important: Supabase Configuration Required
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                To use quiz generation, you need to configure API keys in your Supabase project:
              </p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Go to your Supabase project dashboard</li>
                <li>Navigate to "Edge Functions" in the sidebar</li>
                <li>Select the "generate-quiz" function</li>
                <li>Go to "Environment Variables" tab</li>
                <li>Add your LLM API key (e.g., OPENAI_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY)</li>
                <li>Repeat for the "evaluate-quiz" function</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quiz Information</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter quiz title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic
              </label>
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., JavaScript Fundamentals"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Questions *
              </label>
              <input
                type="number"
                name="totalQuestions"
                value={formData.totalQuestions}
                onChange={handleInputChange}
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Marks *
              </label>
              <input
                type="number"
                name="totalMarks"
                value={formData.totalMarks}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Brief description of the quiz"
            />
          </div>
        </div>

        {/* Question Generation */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Question Generation</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Generation Method
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="topic"
                    checked={generationMethod === 'topic'}
                    onChange={(e) => setGenerationMethod(e.target.value as 'topic' | 'pdf')}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">From Topic</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="pdf"
                    checked={generationMethod === 'pdf'}
                    onChange={(e) => setGenerationMethod(e.target.value as 'topic' | 'pdf')}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">From PDF Document</span>
                </label>
              </div>
            </div>

            {generationMethod === 'pdf' && (
              <div>
                <FileUpload
                  label="PDF Document"
                  description="Upload a PDF document to generate questions from"
                  accept=".pdf"
                  maxSize={10}
                  onFileSelect={setPdfFile}
                  onFileRemove={() => setPdfFile(null)}
                  currentFile={pdfFile?.name}
                />
              </div>
            )}

            <button
              type="button"
              onClick={generateQuestions}
              disabled={generating}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {generating ? 'Generating...' : 'Generate Questions'}
            </button>
          </div>
        </div>

        {/* Generated Questions */}
        {questions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Generated Questions ({questions.length})
              </h2>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Question {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Text *
                      </label>
                      <textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Enter the question text"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Type *
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="short-answer">Short Answer</option>
                        <option value="essay">Essay</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Marks *
                      </label>
                      <input
                        type="number"
                        value={question.marks}
                        onChange={(e) => updateQuestion(index, 'marks', parseInt(e.target.value) || 0)}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {question.type === 'multiple-choice' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Options *</label>
                      {question.options?.map((option, optionIndex) => (
                        <input
                          key={optionIndex}
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(question.options || [])];
                            newOptions[optionIndex] = e.target.value;
                            updateQuestion(index, 'options', newOptions);
                          }}
                          placeholder={`Option ${optionIndex + 1}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          required
                        />
                      ))}
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Correct Answer (Option Number) *
                        </label>
                        <input
                          type="number"
                          value={question.correctAnswer}
                          onChange={(e) => updateQuestion(index, 'correctAnswer', parseInt(e.target.value) || 1)}
                          min="1"
                          max="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evaluation Prompts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Evaluation Prompts</h2>
          <p className="text-gray-600 mb-4">
            Add additional prompts to guide the LLM evaluation process
          </p>

          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Enter evaluation prompt..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addEvaluationPrompt}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {formData.evaluationPrompts.length > 0 && (
              <div className="space-y-2">
                {formData.evaluationPrompts.map((prompt, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{prompt}</span>
                    <button
                      type="button"
                      onClick={() => removeEvaluationPrompt(index)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/quizzes')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || questions.length === 0}
            className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Quiz'}
          </button>
        </div>
      </form>

      {/* LLM Configuration Modal */}
      <LLMConfigModal
        isOpen={showLLMConfig}
        onClose={() => setShowLLMConfig(false)}
        onSave={() => {
          // Refresh the page to show updated config
          window.location.reload();
        }}
      />
    </div>
  );
};

export default QuizCreate;
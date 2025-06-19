import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, Mic, MicOff, Clock, CheckCircle } from 'lucide-react';
import { quizService } from '../services/quiz';
import { speechService } from '../services/speech';
import type { Quiz, QuizAttempt } from '../types/quiz';
import toast from 'react-hot-toast';

const QuizTake: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadQuiz(id);
    }
  }, [id]);

  useEffect(() => {
    // Timer for quiz (optional - can be set based on quiz settings)
    if (timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const loadQuiz = async (quizId: string) => {
    try {
      const quizData = await quizService.getQuizById(quizId);
      if (!quizData) {
        toast.error('Quiz not found');
        navigate('/');
        return;
      }

      setQuiz(quizData);
      
      // Start quiz attempt
      const attemptId = await quizService.startQuizAttempt(quizId);
      const attemptData = await quizService.getQuizAttempt(attemptId);
      setAttempt(attemptData);
      
      if (attemptData?.answers) {
        setAnswers(attemptData.answers);
      }

      // Set timer (30 minutes default)
      setTimeRemaining(30 * 60);
    } catch (error) {
      console.error('Failed to load quiz:', error);
      toast.error('Failed to load quiz');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const speakQuestion = async () => {
    if (!quiz || isSpeaking) return;

    const currentQuestion = quiz.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    try {
      setIsSpeaking(true);
      let textToSpeak = `Question ${currentQuestionIndex + 1}: ${currentQuestion.question}`;
      
      if (currentQuestion.type === 'multiple-choice' && currentQuestion.options) {
        textToSpeak += '. Options are: ' + currentQuestion.options.map((option, index) => 
          `Option ${index + 1}: ${option}`
        ).join('. ');
      }

      await speechService.speak(textToSpeak);
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      toast.error('Failed to speak question');
    } finally {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    speechService.stopSpeaking();
    setIsSpeaking(false);
  };

  const startListening = async () => {
    if (!speechService.isSpeechRecognitionSupported()) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    try {
      setIsListening(true);
      const transcript = await speechService.startListening();
      
      const currentQuestion = quiz?.questions[currentQuestionIndex];
      if (currentQuestion) {
        setAnswers(prev => ({
          ...prev,
          [currentQuestion.id]: transcript
        }));
        
        if (attempt) {
          await quizService.saveAnswer(attempt.id, currentQuestion.id, transcript);
        }
      }
      
      toast.success('Answer recorded');
    } catch (error) {
      console.error('Speech recognition failed:', error);
      toast.error('Failed to record speech');
    } finally {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    speechService.stopListening();
    setIsListening(false);
  };

  const handleAnswerChange = async (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    if (attempt) {
      try {
        await quizService.saveAnswer(attempt.id, questionId, answer);
      } catch (error) {
        console.error('Failed to save answer:', error);
      }
    }
  };

  const nextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!attempt) return;

    const confirmed = window.confirm('Are you sure you want to submit your quiz? This action cannot be undone.');
    if (!confirmed) return;

    setSubmitting(true);
    try {
      await quizService.submitQuiz(attempt.id);
      toast.success('Quiz submitted successfully!');
      navigate(`/quiz/${id}/result/${attempt.id}`);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz not found</h2>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const answeredQuestions = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
                <p className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {timeRemaining !== null && (
                <div className="flex items-center text-red-600">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
                </div>
              )}
              
              <div className="text-sm text-gray-600">
                <span className="font-medium">{answeredQuestions}</span> / {quiz.questions.length} answered
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Question Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {currentQuestion.marks} marks
              </span>
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                {currentQuestion.type.replace('-', ' ')}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {speechService.isSpeechSynthesisSupported() && (
                <button
                  onClick={isSpeaking ? stopSpeaking : speakQuestion}
                  className={`p-2 rounded-lg transition-colors ${
                    isSpeaking 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                  title={isSpeaking ? 'Stop speaking' : 'Read question aloud'}
                >
                  {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              )}
              
              {speechService.isSpeechRecognitionSupported() && currentQuestion.type !== 'multiple-choice' && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`p-2 rounded-lg transition-colors ${
                    isListening 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                  title={isListening ? 'Stop recording' : 'Record answer'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>

          {/* Question Text */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer Input */}
          <div className="mb-8">
            {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <label key={index} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={index + 1}
                      checked={answers[currentQuestion.id] === index + 1}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, parseInt(e.target.value))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-3 text-gray-900">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'short-answer' && (
              <div>
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your answer..."
                />
                {isListening && (
                  <p className="text-sm text-green-600 mt-2 flex items-center">
                    <Mic className="w-4 h-4 mr-1" />
                    Listening... Speak your answer
                  </p>
                )}
              </div>
            )}

            {currentQuestion.type === 'essay' && (
              <div>
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Write your detailed answer..."
                />
                {isListening && (
                  <p className="text-sm text-green-600 mt-2 flex items-center">
                    <Mic className="w-4 h-4 mr-1" />
                    Listening... Speak your answer
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex items-center space-x-4">
              {!isLastQuestion ? (
                <button
                  onClick={nextQuestion}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigation */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Navigation</h3>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : answers[quiz.questions[index].id]
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTake;
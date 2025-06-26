import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, TrendingUp, TrendingDown, Lightbulb, Award, Video, Send, Copy, Check } from 'lucide-react';
import { quizService } from '../services/quiz';
import type { Quiz, QuizAttempt } from '../types/quiz';
import toast from 'react-hot-toast';

// Declare Daily as a global variable
declare global {
  interface Window {
    Daily: any;
  }
}

interface ConversationResponse {
  conversation_url: string;
  conversation_id: string;
}

const QuizResult: React.FC = () => {
  const { quizId, attemptId } = useParams<{ quizId: string; attemptId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Tavus.io integration states
  const [showTavusAgent, setShowTavusAgent] = useState(false);
  const [tavusLoading, setTavusLoading] = useState(false);
  const [conversationUrl, setConversationUrl] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [dailyCallObject, setDailyCallObject] = useState<any>(null);
  const [copiedText, setCopiedText] = useState('');

  useEffect(() => {
    if (quizId && attemptId) {
      loadResults();
    }
  }, [quizId, attemptId]);

  // Cleanup Daily.js call object when component unmounts
  useEffect(() => {
    return () => {
      if (dailyCallObject) {
        dailyCallObject.destroy();
      }
    };
  }, [dailyCallObject]);

  const loadResults = async () => {
    try {
      if (!quizId || !attemptId) return;

      const [quizData, attemptData] = await Promise.all([
        quizService.getQuizById(quizId),
        quizService.getQuizAttempt(attemptId)
      ]);

      if (!quizData || !attemptData) {
        toast.error('Results not found');
        navigate('/');
        return;
      }

      setQuiz(quizData);
      setAttempt(attemptData);
    } catch (error) {
      console.error('Failed to load results:', error);
      toast.error('Failed to load results');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const createTavusConversation = async (): Promise<ConversationResponse> => {
    const replicaId = import.meta.env.VITE_TAV_RESULT_COACH_REPLICAID;
    const apiKey = import.meta.env.VITE_TAVUS_API_KEY;
    
    if (!replicaId || !apiKey) {
      throw new Error('Tavus configuration missing. Please check environment variables.');
    }

    const response = await fetch('https://tavusapi.com/v2/conversations', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        replica_id: replicaId,
        conversation_name: `Quiz Result Coaching - ${quiz?.title}`,
        conversational_context: `You are a quiz result coach helping a student understand their performance. The student scored ${attempt?.evaluationResult?.score}/${attempt?.totalMarks} marks (${percentage}%) on "${quiz?.title}". Provide encouraging feedback and guidance for improvement.`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
  };

  const initializeDailyCallObject = async (url: string) => {
    try {
      if (!window.Daily) {
        throw new Error('Daily.js library not loaded');
      }

      const callFrame = window.Daily.createFrame({
        url: url,
        showLeaveButton: true,
        showFullscreenButton: false,
      });

      await callFrame.join();
      setDailyCallObject(callFrame);
      // Left meeting event.
      callFrame.on('left-meeting', () => {
        console.log('Daily.js call ended or user left.');
        setShowTavusAgent(false); // Hide the agent UI
        setDailyCallObject(null); // Clear the dailyCallObject state
        // Optionally, clear the conversation URL/ID if you want to reset fully
        setConversationUrl('');
        setConversationId('');
        toast.success('AI Coach session ended.');
      });
      
      return callFrame;
    } catch (err) {
      console.error('Failed to initialize Daily call object:', err);
      throw err;
    }
  };

  const sendTavusMessage = async (text: string) => {
    if (!dailyCallObject || !conversationId) {
      throw new Error('Daily call object not initialized or conversation ID missing');
    }

    try {
      const interactionPayload = {
        message_type: "conversation",
        event_type: "conversation.respond",
        conversation_id: conversationId,
        properties: {
          text: text
        }
      };

      await dailyCallObject.sendAppMessage(interactionPayload);
      return true;
    } catch (err) {
      console.error('Failed to send message to Tavus:', err);
      throw err;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      throw err;
    }
  };

  const handleLaunchTavusAgent = async () => {
    setTavusLoading(true);
    
    try {
      const conversation = await createTavusConversation();
      setConversationUrl(conversation.conversation_url);
      setConversationId(conversation.conversation_id);
      setShowTavusAgent(true);

      // Initialize Daily.js call object for message sending
      try {
        await initializeDailyCallObject(conversation.conversation_url);
      } catch (err) {
        console.warn('Failed to initialize Daily call object, falling back to clipboard:', err);
      }
      
      toast.success('Tavus agent launched successfully!');
    } catch (error) {
      console.error('Failed to launch Tavus agent:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to launch Tavus agent');
    } finally {
      setTavusLoading(false);
    }
  };

  const handleSendToAgent = async (content: string, type: string) => {
    if (!content.trim()) return;

    const message = `Here are my ${type.toLowerCase()}: ${content}`;

    try {
      if (dailyCallObject && conversationId) {
        // Send message directly to Tavus conversation
        await sendTavusMessage(message);
        toast.success(`${type} sent to coach successfully!`);
      } else {
        // Fallback to clipboard
        await copyToClipboard(message);
        toast.success(`${type} copied to clipboard! You can paste it in the conversation.`);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quiz || !attempt || !attempt.evaluationResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Results not available</h2>
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

  const { evaluationResult } = attempt;
  const percentage = Math.round((evaluationResult.score / attempt.totalMarks) * 100);
  
  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Quiz Results</h1>
              <p className="text-sm text-gray-600">{quiz.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Score Overview */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className={`text-6xl font-bold ${getGradeColor(percentage)} mb-2`}>
              {percentage}%
            </div>
            <div className={`text-2xl font-semibold ${getGradeColor(percentage)} mb-4`}>
              Grade: {getGrade(percentage)}
            </div>
            <div className="text-gray-600">
              {evaluationResult.score} out of {attempt.totalMarks} marks
            </div>
          </div>

          <div className="flex items-center justify-center mb-6">
            <Award className={`w-16 h-16 ${getGradeColor(percentage)}`} />
          </div>

          <div className="bg-gray-100 rounded-full h-4 mb-4">
            <div 
              className={`h-4 rounded-full transition-all duration-1000 ${
                percentage >= 90 ? 'bg-green-500' :
                percentage >= 80 ? 'bg-blue-500' :
                percentage >= 70 ? 'bg-yellow-500' :
                percentage >= 60 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>

          <p className="text-gray-600">
            Completed on {new Date(attempt.completedAt!).toLocaleDateString()} at{' '}
            {new Date(attempt.completedAt!).toLocaleTimeString()}
          </p>
        </div>

        {/* Detailed Feedback */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Feedback</h2>
          
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {evaluationResult.detailedFeedback}
            </p>
          </div>
        </div>

        {/* Strengths, Weaknesses, and Improvements */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Strengths */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Strengths</h3>
              {showTavusAgent && (
                <button
                  onClick={() => handleSendToAgent(evaluationResult.strengths.join(', '), 'Strengths')}
                  className="ml-auto p-1 text-green-600 hover:bg-green-50 rounded"
                  title="Send strengths to coach"
                >
                  {dailyCallObject ? <Send className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            
            {evaluationResult.strengths.length > 0 ? (
              <ul className="space-y-2">
                {evaluationResult.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No specific strengths identified.</p>
            )}
          </div>

          {/* Weaknesses */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <XCircle className="w-6 h-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Improvement Areas</h3>
              {showTavusAgent && (
                <button
                  onClick={() => handleSendToAgent(evaluationResult.weaknesses.join(', '), 'Areas for Improvement')}
                  className="ml-auto p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Send weaknesses to coach"
                >
                  {dailyCallObject ? <Send className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            
            {evaluationResult.weaknesses.length > 0 ? (
              <ul className="space-y-2">
                {evaluationResult.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start">
                    <TrendingDown className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{weakness}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No specific weaknesses identified.</p>
            )}
          </div>

          {/* Improvement Suggestions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Lightbulb className="w-6 h-6 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Suggestions</h3>
              {showTavusAgent && (
                <button
                  onClick={() => handleSendToAgent(evaluationResult.improvements.join(', '), 'Improvement Suggestions')}
                  className="ml-auto p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                  title="Send suggestions to coach"
                >
                  {dailyCallObject ? <Send className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            
            {evaluationResult.improvements.length > 0 ? (
              <ul className="space-y-2">
                {evaluationResult.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start">
                    <Lightbulb className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{improvement}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No specific suggestions provided.</p>
            )}
          </div>
        </div>

        {/* Tavus.io Agent Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Video className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Get Personalized Coaching</h3>
            </div>
            
            {!showTavusAgent && (
              <button
                onClick={handleLaunchTavusAgent}
                disabled={tavusLoading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Video className="w-4 h-4 mr-2" />
                {tavusLoading ? 'Launching...' : 'Launch AI Coach'}
              </button>
            )}
            {showTavusAgent && dailyCallObject && (
               <button
                  onClick={() => dailyCallObject.leave()}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
               >End AI Coach Call</button>
            )}
          </div>
          
          {showTavusAgent ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Discuss your quiz results with our AI coach. Click the send buttons next to each section above to share specific feedback with your coach.
              </p>
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                
              </div>
              {dailyCallObject && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  ✓ Direct message sending enabled - use the send buttons above to share your results
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Connect with our AI coach to get personalized feedback on your quiz performance and guidance for improvement.
              </p>
              <p className="text-sm text-gray-500">
                The coach will help you understand your strengths, work on areas for improvement, and provide study recommendations.
              </p>
            </div>
          )}
        </div>

        {/* Quiz Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Summary</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{quiz.totalQuestions}</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(attempt.answers).length}
              </div>
              <div className="text-sm text-gray-600">Answered</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{attempt.totalMarks}</div>
              <div className="text-sm text-gray-600">Total Marks</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((new Date(attempt.completedAt!).getTime() - new Date(attempt.startedAt).getTime()) / 60000)}
              </div>
              <div className="text-sm text-gray-600">Minutes Taken</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Home
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Print Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResult;
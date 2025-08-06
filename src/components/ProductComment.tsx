import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User } from 'lucide-react';
import { toPersianDigits } from '../utils/numberUtils';
import apiService from '../services/apiService';
import { formatUnixTimestampShort } from '../utils/dateUtils';

interface Comment {
  id: string;
  content: string;
  relatedType: string;
  relatedId: string;
  userId: string;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profile: string | null;
    birthdate: string | null;
    birthPlace: string | null;
    gender: string;
    nationalCode: string;
    fatherName: string | null;
    motherName: string | null;
    married: string;
    marriageDate: string | null;
    divorceDate: string | null;
    userId: string;
  };
}

interface ProductCommentProps {
  authToken: string;
  stockId: string;
  userId: string;
  onError: (error: string) => void;
  refreshTrigger?: number;
}

const ProductComment: React.FC<ProductCommentProps> = ({ 
  authToken, 
  stockId, 
  userId, 
  onError, 
  refreshTrigger 
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const getFullName = (user: any) => {
    if (!user) return '-';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || '-';
  };

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const data = await apiService.getComments({ 
        relatedType: 'product',
        relatedId: stockId 
      }, authToken);
      setComments(data.data.data || []);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await apiService.createComment({
        relatedType: 'product',
        relatedId: stockId,
        userId: userId,
        content: newComment.trim()
      }, authToken);

      // Clear the input and refresh comments
      setNewComment('');
      await fetchComments();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitComment();
    }
  };

  useEffect(() => {
    fetchComments();
  }, [stockId, refreshTrigger]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
        <MessageSquare className="w-5 h-5 text-blue-500" />
        <span>نظرات محصول</span>
        {comments.length > 0 && (
          <span className="text-sm text-gray-500">
            ({toPersianDigits(comments.length)} نظر)
          </span>
        )}
      </h3>

      {/* Add Comment Form */}
      <div className="mb-6">
        <div className="flex space-x-3 space-x-reverse">
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="نظر خود را درباره این محصول بنویسید..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              disabled={submittingComment}
            />
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={submitComment}
              disabled={!newComment.trim() || submittingComment}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
            >
              {submittingComment ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>ارسال</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {loadingComments ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="mr-3 text-gray-600">در حال بارگذاری نظرات...</span>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.slice().reverse().map((comment, index) => (
            <div
              key={comment.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start space-x-3 space-x-reverse">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-900">
                      {comment.user?.firstName} {comment.user?.lastName}
                      {comment.user?.nationalCode && (
                        <span className="text-xs text-gray-500 mr-2">
                          ({toPersianDigits(comment.user.nationalCode)})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatUnixTimestampShort(comment.createdAt)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <div className="text-gray-500 text-lg mb-2">هیچ نظری یافت نشد</div>
          <p className="text-gray-400 text-sm">اولین نفری باشید که نظر می‌دهد</p>
        </div>
      )}
    </div>
  );
};

export default ProductComment; 
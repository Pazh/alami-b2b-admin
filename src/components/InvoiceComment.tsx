import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { MessageSquare, Send, User } from 'lucide-react';
import { toPersianDigits } from '../utils/numberUtils';
import apiService from '../services/apiService';
import { formatPersianDateForDisplay } from '../utils/dateUtils';

interface Comment {
  id: string;
  content: string;
  relatedType: string;
  relatedId: string;
  userId: string;
  createdAt: string;
  fileUrl?: string;
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

interface InvoiceCommentProps {
  authToken: string;
  factorId: string;
  userId: string;
  onError: (error: string) => void;
  refreshTrigger?: number;
}

const InvoiceComment: React.FC<InvoiceCommentProps> = ({ 
  authToken, 
  factorId, 
  userId, 
  onError, 
  refreshTrigger 
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isImageUrl = (url: string) => /\.(png|jpe?g|gif|webp|svg)$/i.test(url);

  const formatDateTime = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    // Convert to Persian date format
    const persianYear = year - 621;
    const persianMonth = month;
    const persianDay = day;
    
    return toPersianDigits(`${persianYear}/${persianMonth}/${persianDay} ${hours}:${minutes}`);
  };

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
      const data = await apiService.getComments({ relatedId: factorId }, authToken);
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
        relatedType: 'factor',
        relatedId: factorId,
        userId: userId,
        content: newComment.trim(),
        fileUrl: uploadedFileUrl,
      }, authToken);

      // Clear the input and refresh comments
      setNewComment('');
      setSelectedFile(null);
      setUploadedFileUrl(undefined);
      await fetchComments();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploading(true);
      setUploadError(null);
      const upload = await apiService.uploadPublicFile(selectedFile, userId, 'alami', authToken);
      setUploadedFileUrl(upload.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در آپلود فایل';
      // Friendly hint for unsupported formats
      setUploadError('آپلود فایل ناموفق بود. احتمالاً فرمت فایل پشتیبانی نمی‌شود.');
      onError(message);
    } finally {
      setUploading(false);
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
  }, [factorId, refreshTrigger]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 panel-rtl">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-rtl-2">
        <span>نظرات</span>
        <MessageSquare className="w-5 h-5 text-blue-500" />
        {comments.length > 0 && (
          <span className="text-sm text-gray-500">
            ({toPersianDigits(comments.length)} نظر)
          </span>
        )}
      </h3>

      {/* Add Comment Form */}
      <div className="mb-6">
        <div className="flex space-x-rtl-3">
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="نظر خود را بنویسید..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              disabled={submittingComment}
            />
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  setUploadError(null);
                  setUploadedFileUrl(undefined);
                  setSelectedFile(e.target.files && e.target.files[0] ? e.target.files[0] : null);
                }}
                disabled={submittingComment || uploading}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submittingComment || uploading}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  انتخاب فایل
                </button>
                {selectedFile && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200">
                    {selectedFile.name}
                  </span>
                )}
                {selectedFile && !uploadedFileUrl && (
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 disabled:opacity-50"
                  >
                    {uploading ? 'در حال آپلود...' : 'آپلود فایل'}
                  </button>
                )}
                {uploadedFileUrl && (
                  <span className="text-xs text-green-600">فایل آپلود شد</span>
                )}
              </div>
              {uploadError && (
                <div className="text-xs text-red-600 mt-1">{uploadError}</div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={submitComment}
              disabled={!newComment.trim() || submittingComment}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-rtl-2"
            >
              <span>ارسال</span>
              {submittingComment ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
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
              <div className="flex items-start space-x-rtl-3">
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
                      {formatDateTime(comment.createdAt)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                  {comment.fileUrl && (
                    <div className="mt-2 space-y-2">
                      {isImageUrl(comment.fileUrl) ? (
                        <a href={comment.fileUrl} target="_blank" rel="noopener noreferrer">
                          <img src={comment.fileUrl} alt="attachment" className="max-h-32 rounded border border-gray-200" />
                        </a>
                      ) : null}
                      <a href={comment.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm underline">
                        دانلود فایل پیوست
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
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

export default InvoiceComment; 
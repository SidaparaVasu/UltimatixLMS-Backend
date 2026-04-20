import React, { useEffect, useState } from 'react';
import { Save, FileText, Video, Link as LinkIcon, UploadCloud, LayoutList, MonitorPlay, Presentation } from 'lucide-react';
import { CurriculumNode, ContentType } from './CurriculumTree';
import { cn } from '@/utils/cn';
import { QuizBuilder } from './QuizBuilder';
import { getVideoInfo, fetchVideoTitle } from '@/utils/video-utils';
import { fileApi } from '@/api/file-api';

interface LessonEditorProps {
  node: CurriculumNode;
  onSave: (id: string, updates: Partial<CurriculumNode>) => void;
}

const isDocumentType = (type: ContentType) => type === 'PDF' || type === 'PPT' || type === 'DOCUMENT';

export const LessonEditor: React.FC<LessonEditorProps> = ({ node, onSave }) => {
  const [title, setTitle] = useState(node.title);
  const [contentType, setContentType] = useState<ContentType>(node.contentType || 'VIDEO');
  const [videoUrl, setVideoUrl] = useState(node.videoUrl || '');
  const [linkUrl, setLinkUrl] = useState(node.contentType === 'LINK' ? node.contentUrl || '' : '');
  const [docFile, setDocFile] = useState<{ name: string; size: string } | null>(node.docMetadata || null);
  const [fileRefId, setFileRefId] = useState<number | null>(node.fileRefId || null);
  const [fileUrl, setFileUrl] = useState<string | null>(node.fileUrl || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'complete'>(node.docMetadata ? 'complete' : 'idle');
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const videoInfo = getVideoInfo(videoUrl);

  useEffect(() => {
    setTitle(node.title);
    setContentType(node.contentType || 'VIDEO');
    setVideoUrl(node.videoUrl || '');
    setLinkUrl(node.contentType === 'LINK' ? node.contentUrl || '' : '');
    setDocFile(node.docMetadata || null);
    setFileRefId(node.fileRefId || null);
    setFileUrl(node.fileUrl || null);
    setUploadStatus(node.docMetadata ? 'complete' : 'idle');
    setUploadProgress(node.docMetadata ? 100 : 0);
  }, [node]);

  const fetchVideoMetadata = async (url: string) => {
    if (!url || !videoInfo) return;
    setIsFetchingMetadata(true);
    const fetchedTitle = await fetchVideoTitle(url);
    if (fetchedTitle && (!title || title === 'New Lesson' || title === 'Untitled Lesson')) {
      setTitle(fetchedTitle);
    }
    setIsFetchingMetadata(false);
  };

  const resetContentState = (nextType: ContentType) => {
    setContentType(nextType);
    setVideoUrl('');
    setLinkUrl('');
    setDocFile(null);
    setFileRefId(null);
    setFileUrl(null);
    setUploadStatus('idle');
    setUploadProgress(0);
  };

  const handleFormatSwitch = (nextType: ContentType) => {
    if (nextType === contentType) return;

    const hasExistingContent =
      !!videoUrl ||
      !!linkUrl ||
      !!docFile ||
      !!fileRefId ||
      !!node.contentId;

    if (hasExistingContent) {
      const confirmed = window.confirm('Switching the content format will clear all currently entered data for this lesson. Do you want to continue?');
      if (!confirmed) {
        return;
      }
    }

    resetContentState(nextType);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploadingFile(true);
    setUploadStatus('uploading');
    setUploadProgress(25);

    try {
      const uploaded = await fileApi.uploadFile(file);
      if (!uploaded) {
        setUploadStatus('idle');
        setUploadProgress(0);
        return;
      }

      setDocFile({
        name: uploaded.original_name || file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      });
      setFileRefId(uploaded.id);
      setFileUrl(uploaded.file_url || null);
      setUploadProgress(100);
      setUploadStatus('complete');
    } finally {
      setIsUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleSave = () => {
    const persistedUrl = contentType === 'VIDEO'
      ? videoUrl.trim()
      : contentType === 'LINK'
        ? linkUrl.trim()
        : '';

    onSave(node.id, {
      title,
      contentType,
      contentUrl: persistedUrl,
      videoUrl: contentType === 'VIDEO' ? persistedUrl : '',
      fileRefId: isDocumentType(contentType) ? fileRefId : null,
      fileUrl: isDocumentType(contentType) ? fileUrl : null,
      docMetadata: isDocumentType(contentType) ? docFile : null,
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#12141c] text-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-slate-800/80 bg-[#0a0c10] shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Lesson Editor</h2>
            <p className="text-xs text-slate-400">Configure learning materials</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isUploadingFile}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-md shadow-[0_0_15px_rgba(37,99,235,0.2)] transition-all flex items-center gap-2"
        >
          <Save size={16} />
          Save Lesson Draft
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
        <section className="space-y-4">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Lesson Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="px-4 py-3 bg-[#0a0c10] border border-slate-700 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              placeholder="e.g. Setting up the Environment"
            />
          </div>
        </section>

        <section className="space-y-4">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 block">Content Format</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            {[
              { type: 'VIDEO', label: 'MP4 (YouTube)', icon: Video, active: true },
              { type: 'PDF', label: 'PDF Document', icon: FileText, active: true },
              { type: 'PPT', label: 'PPT Viewer', icon: Presentation, active: true },
              { type: 'DOCUMENT', label: 'Document File', icon: FileText, active: true },
              { type: 'LINK', label: 'External Link', icon: LinkIcon, active: true },
              { type: 'QUIZ', label: 'Assessment', icon: LayoutList, active: true },
              { type: 'SCORM', label: 'SCORM Package', icon: MonitorPlay, active: false },
            ].map(format => (
              <button
                key={format.type}
                disabled={!format.active}
                onClick={() => handleFormatSwitch(format.type as ContentType)}
                className={cn(
                  'flex items-center justify-center gap-2 p-3 rounded-md border transition-all relative overflow-hidden',
                  contentType === format.type
                    ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                    : format.active
                      ? 'bg-slate-800/30 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'bg-[#0b0d13] border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                )}
              >
                {!format.active && (
                  <div className="absolute top-0 right-0 bg-slate-800 text-[8px] px-1 text-slate-400 rounded-bl-sm">
                    SOON
                  </div>
                )}
                <format.icon size={16} />
                <span className="text-[11px] font-bold tracking-wide">{format.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="pt-6 border-t border-slate-800">
          {contentType === 'VIDEO' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest block">Video Source URL</label>
                {videoUrl && videoInfo && (
                  <button
                    onClick={() => fetchVideoMetadata(videoUrl)}
                    disabled={isFetchingMetadata}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase"
                  >
                    {isFetchingMetadata ? 'Fetching...' : 'Auto-fill Title'}
                  </button>
                )}
              </div>
              <input
                type="url"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-3 bg-[#0a0c10] border border-slate-700 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-sm"
              />

              <div className="relative aspect-video rounded-lg bg-[#0a0c10] border border-slate-800 flex items-center justify-center text-slate-500 overflow-hidden group">
                {videoInfo ? (
                  videoInfo.type === 'youtube' ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${videoInfo.id}`}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <iframe
                      src={`https://player.vimeo.com/video/${videoInfo.id}`}
                      className="absolute inset-0 w-full h-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  )
                ) : (
                  <div className="text-center">
                    <Video size={32} className="mx-auto mb-2 opacity-50 transition-transform group-hover:scale-110 duration-500" />
                    <p className="text-xs">
                      {videoUrl ? 'Invalid URL or unsupported provider' : 'Paste a video link to see preview'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isDocumentType(contentType) && (
            <div className="space-y-4">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest block">Document Configuration</label>

              {uploadStatus === 'idle' ? (
                <label className="border-2 border-dashed border-slate-700 rounded-md p-10 flex flex-col items-center justify-center text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group">
                  <input
                    type="file"
                    className="hidden"
                    accept={
                      contentType === 'PDF'
                        ? '.pdf'
                        : contentType === 'PPT'
                          ? '.ppt,.pptx'
                          : '.pdf,.ppt,.pptx,.doc,.docx'
                    }
                    onChange={handleFileChange}
                  />
                  <UploadCloud size={40} className="text-slate-500 mb-3 group-hover:text-blue-400 transition-colors" />
                  <h4 className="text-sm font-bold text-slate-300 mb-1">Click to upload {contentType}</h4>
                  <p className="text-[10px] text-slate-500 max-w-xs mb-3 uppercase tracking-tighter">Drag &amp; Drop supported</p>
                  <div className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[9px] font-bold">
                    In-browser viewer enabled
                  </div>
                </label>
              ) : (
                <div className="bg-[#0a0c10] border border-slate-800 rounded-lg p-5 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center shrink-0">
                      {contentType === 'PDF' ? <FileText className="text-red-400" /> : <Presentation className="text-orange-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-200 truncate">{docFile?.name}</h4>
                      <p className="text-xs text-slate-500">{docFile?.size}</p>
                    </div>
                    {uploadStatus === 'complete' && (
                      <button
                        onClick={() => resetContentState(contentType)}
                        className="text-[10px] font-bold text-slate-500 hover:text-red-400 transition-colors"
                      >
                        REPLACE
                      </button>
                    )}
                  </div>

                  {uploadStatus !== 'complete' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                        <span className="text-blue-400">{isUploadingFile ? 'Uploading...' : 'Preparing upload...'}</span>
                        <span className="text-slate-500">{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300 bg-blue-500"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadStatus === 'complete' && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                        <span className="text-[8px] font-bold text-black">OK</span>
                      </div>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Ready for course launch</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {contentType === 'LINK' && (
            <div className="space-y-4">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest block">External Resource Configuration</label>

              <div className="flex flex-col gap-4">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/reference-material"
                  className="w-full px-4 py-3 bg-[#0a0c10] border border-slate-700 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-sm"
                />

                <label className="flex items-center gap-3 p-4 border border-slate-700 bg-slate-800/30 rounded-md cursor-pointer hover:bg-slate-800/50 transition">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900" />
                  <div>
                    <p className="text-sm font-semibold text-white">Require "Mark Completed"</p>
                    <p className="text-xs text-slate-400 text-balance">
                      The learner must explicitly click "Mark Completed" after visiting this link for it to register as finished.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {contentType === 'QUIZ' && (
            <div className="pt-2">
              <QuizBuilder />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

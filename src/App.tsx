import { useState } from 'react';
import { FigmaApiClient } from './components/figma-api';
import { HtmlGenerator } from './components/html-generator';
import type { FigmaNode } from './types/types';

function FigmaConverter() {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const extractFileKey = (url: string): string | null => {
    const patterns = [
      /figma\.com\/design\/([a-zA-Z0-9]+)/,
      /figma\.com\/file\/([a-zA-Z0-9]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const convertToHtml = async () => {
    setError('');
    setSuccess(false);
    if (!figmaUrl || !apiKey) {
      setError('Please fill in both fields');
      return;
    }
    const fileKey = extractFileKey(figmaUrl);
    if (!fileKey) {
      setError('Invalid Figma URL');
      return;
    }
    setLoading(true);
    try {
      const client = new FigmaApiClient(apiKey);
      const fileData = await client.getFile(fileKey);
      const page = fileData.document.children[0];
      const frame = page.children[0] as FigmaNode;
      if (!frame) throw new Error('No frame found in the file');
      const generator = new HtmlGenerator();
      const html = generator.generateHTML(frame);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${frame.name.toLowerCase().replace(/\s+/g, '-')}.html`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-fade-in-scale {
          animation: fadeInScale 0.5s ease-out forwards;
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.5s ease-out forwards;
        }
        .animate-pulse-subtle {
          animation: pulse 2s ease-in-out infinite;
        }
        .delay-100 {
          animation-delay: 0.1s;
          opacity: 0;
        }
        .delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }
        .delay-300 {
          animation-delay: 0.3s;
          opacity: 0;
        }
        .delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }
      `}</style>
      <div
        className="h-[90vh] w-[90vh] bg-cover bg-center rounded-xl shadow-2xl relative flex items-center justify-center px-16 py-12 animate-fade-in-scale"
        style={{
          backgroundImage: 'url("/background.webp")',
          backgroundColor: 'rgba(255,255,255,0.15)',
          backgroundBlendMode: 'lighten',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.6)',
          fontFamily: '"GT Super Display", "Crimson Pro", serif',
        }}
      >
        <div className="w-full max-w-3xl text-white mx-auto">
          <div className="mb-8 animate-fade-in-up delay-100">
            <h1 className="text-4xl font-semibold mb-2 italic">Figma Converter</h1>
            <p className="text-base text-white">
              Convert Figma designs to HTML/CSS
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8 shadow-inner animate-fade-in-up delay-200 transition-all duration-300 hover:bg-white/15 hover:border-white/30">
            <div className="space-y-6">
              <div className="animate-slide-in-left delay-300">
                <label className="block text-sm font-medium mb-2">Figma URL</label>
                <input
                  type="text"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="https://www.figma.com/design/..."
                  className="w-full px-4 py-2.5 rounded-md border border-white/30 bg-white/10 text-white placeholder:text-white focus:outline-none focus:ring-2 focus:ring-white/40 transition-all duration-300 hover:bg-white/15 focus:scale-[1.01]"
                />
              </div>

              <div className="animate-slide-in-left delay-400">
                <label className="block text-sm font-medium mb-2">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="figd_..."
                  className="w-full px-4 py-2.5 rounded-md border border-white/30 bg-white/10 text-white placeholder:text-white focus:outline-none focus:ring-2 focus:ring-white/40 transition-all duration-300 hover:bg-white/15 focus:scale-[1.01]"
                />
                <p className="text-xs text-neutral-300 mt-2">
                  Get your token from Figma Settings / Personal Access Tokens
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-md bg-red-500/10 border border-red-700 animate-fade-in-up">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 rounded-md bg-green-950/50 border border-green-900 animate-fade-in-up">
                  <p className="text-sm text-green-300">
                    HTML file downloaded successfully
                  </p>
                </div>
              )}

              <button
                onClick={convertToHtml}
                disabled={loading}
                className="w-full gap-x-3 h-10 px-4 bg-white/20 hover:bg-green-400/10 text-white rounded-md font-medium border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-pulse-subtle">Converting...</span>
                  </span>
                ) : (
                  'Convert & Download'
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 animate-fade-in-up delay-300 transition-all duration-300 hover:bg-white/15 hover:border-white/30">
            <h3 className="text-sm font-semibold mb-3">How to Use</h3>
            <ol className="text-sm text-neutral-200 space-y-2 list-decimal list-inside">
              <li className="transition-all duration-200 hover:translate-x-1">Copy your Figma file URL</li>
              <li className="transition-all duration-200 hover:translate-x-1">Get your API key from Figma settings</li>
              <li className="transition-all duration-200 hover:translate-x-1">Paste both above and hit convert</li>
              <li className="transition-all duration-200 hover:translate-x-1">Download starts automatically</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FigmaConverter;
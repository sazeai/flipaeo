'use client';

import { useState } from 'react';
import { Upload, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';

export default function PinterestGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [finalPinUrl, setFinalPinUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Store the AI's plan for display
  const [aiPlan, setAiPlan] = useState<{prompt: string, title: string, template: string} | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
      setFinalPinUrl(null);
      setAiPlan(null);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setFinalPinUrl(null);
    setAiPlan(null);

    try {
      // Step 1: AI Art Director analyzes image, generates prompt & copy
      setLoadingStep('AI Art Director is analyzing product & generating assets (10-15s)...');
      const formData = new FormData();
      formData.append('image', file);

      const generateResponse = await fetch('/api/generate-pin', {
        method: 'POST',
        body: formData,
      });

      if (!generateResponse.ok) {
        const errData = await generateResponse.json();
        throw new Error(errData.error || 'Failed to generate pin assets');
      }

      const { imageUrl, title, templateId, debugPrompt } = await generateResponse.json();
      
      setAiPlan({
        prompt: debugPrompt,
        title: title,
        template: templateId
      });

      // Step 2: Render the final Pin using Next.js ImageResponse
      setLoadingStep('Rendering final Pinterest Pin layout...');
      const renderResponse = await fetch('/api/render-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl, title, templateId }),
      });

      if (!renderResponse.ok) {
        const errText = await renderResponse.text();
        throw new Error(errText || 'Failed to render final pin');
      }

      const blob = await renderResponse.blob();
      const finalUrl = URL.createObjectURL(blob);
      setFinalPinUrl(finalUrl);

    } catch (err: any) {
      setError(err.message || 'An error occurred during generation');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-8 font-sans text-neutral-900">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Pinterest Pin Generator v2</h1>
          <p className="text-neutral-500 max-w-2xl mx-auto">
            Upload a raw product. Our AI Art Director will analyze it, write a custom background prompt, generate elegant copy, and select the perfect layout template.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Upload & AI Plan */}
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-6">
              <h2 className="text-xl font-semibold">1. Upload Product</h2>
              
              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:bg-neutral-50 transition-colors relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {previewUrl ? (
                  <div className="space-y-4">
                    <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg object-contain shadow-sm" />
                    <p className="text-sm text-neutral-500">Click to change image</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-neutral-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Click or drag image to upload</p>
                      <p className="text-sm text-neutral-500">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={!file || loading}
                className="w-full bg-black text-white py-3 px-4 rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Smart Pin
                  </>
                )}
              </button>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                  {error}
                </div>
              )}
            </div>

            {/* AI Director's Plan (Visible after generation) */}
            {aiPlan && (
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-4">
                <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Art Director's Plan
                </h3>
                <div className="space-y-3 text-sm text-blue-800">
                  <div>
                    <span className="font-semibold block">Generated Image Prompt:</span>
                    <p className="italic bg-white/50 p-2 rounded mt-1">{aiPlan.prompt}</p>
                  </div>
                  <div>
                    <span className="font-semibold block">Generated Copy (4-6 words):</span>
                    <p className="bg-white/50 p-2 rounded mt-1">{aiPlan.title}</p>
                  </div>
                  <div>
                    <span className="font-semibold block">Selected Layout:</span>
                    <p className="bg-white/50 p-2 rounded mt-1 font-mono">{aiPlan.template}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Result Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-6 flex flex-col">
            <h2 className="text-xl font-semibold">2. Final Rendered Pin</h2>
            
            <div className="flex-1 bg-neutral-100 rounded-xl border border-neutral-200 flex items-center justify-center overflow-hidden relative min-h-[600px]">
              {loading ? (
                <div className="flex flex-col items-center gap-4 text-neutral-500 text-center px-4">
                  <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                  <p className="font-medium">{loadingStep}</p>
                </div>
              ) : finalPinUrl ? (
                <img
                  src={finalPinUrl}
                  alt="Generated Pin"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-neutral-400">
                  <ImageIcon className="w-12 h-12 opacity-20" />
                  <p>Your generated pin will appear here</p>
                </div>
              )}
            </div>
            
            {finalPinUrl && (
              <a 
                href={finalPinUrl} 
                download="pinterest-pin.png"
                className="w-full bg-neutral-100 text-neutral-900 py-3 px-4 rounded-xl font-medium hover:bg-neutral-200 flex items-center justify-center transition-colors"
              >
                Download Pin
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

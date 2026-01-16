import { GoogleGenAI, Modality, Type } from "@google/genai";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Audio context singleton to manage playback
let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

/**
 * Decodes base64 string to Uint8Array.
 */
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer.
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Stops any currently playing audio.
 */
export const stopAudio = () => {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {
      // Ignore errors if already stopped
    }
    currentSource = null;
  }
};

/**
 * Generates speech from text using Gemini and plays it.
 * @param text The text to read aloud.
 * @param onEnded Callback function triggered when playback finishes.
 */
export const playTextToSpeech = async (text: string, onEnded?: () => void): Promise<void> => {
  stopAudio(); // Stop any currently playing audio

  if (!text.trim()) return;

  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio content received from Gemini TTS.");
    }

    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      audioContext,
      24000,
      1
    );

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    source.onended = () => {
      currentSource = null;
      if (onEnded) onEnded();
    };

    currentSource = source;
    source.start();
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

/**
 * Corrects the grammar of the provided text using Gemini and returns corrected text, suggestions, grammar rules, and Hindi translation.
 * @param input The text to correct.
 * @returns Object containing corrected text, style suggestions, grammar rules, and Hindi translation.
 */
export const correctGrammar = async (input: string): Promise<{ corrected: string; hindi: string; suggestions: string[]; grammarRules: string[] }> => {
  if (!input.trim()) return { corrected: "", hindi: "", suggestions: [], grammarRules: [] };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: input,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            corrected: {
              type: Type.STRING,
              description: "The grammatically corrected English text."
            },
            grammarRules: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of very simple, non-technical explanations for the corrections made, easy for a beginner to understand."
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of style improvement suggestions (e.g., word choice, sentence structure, conciseness)."
            },
            hindi: {
              type: Type.STRING,
              description: "The Hindi translation of the corrected English text."
            }
          },
          required: ["corrected", "grammarRules", "suggestions", "hindi"]
        },
        systemInstruction: `
          You are an expert English editor and translator. 
          Your task is to take the provided user text and:
          1. Rewrite it into standard, grammatically correct English. Fix spelling, grammar, punctuation, and capitalization.
          2. Explain the grammar changes using very simple, everyday language. Avoid complex grammatical terms or jargon. Explain *why* the change was made in a way that is easy for a non-native speaker or beginner to understand. For example, instead of saying "Subject-verb agreement error," say "Since 'cat' is one thing, we use 'is', not 'are'."
          3. Provide 1-3 brief style suggestions to improve the text further (e.g., better word choice, active voice, conciseness). If the text is simple or perfect, suggest a more formal or advanced alternative.
          4. Translate the *corrected* English text into Hindi.
          
          Strictly preserve the original meaning and tone in the corrected text.
        `,
        temperature: 0.3,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No correction returned from the model.");
    }
    
    // Parse the JSON response
    const result = JSON.parse(text);
    return {
      corrected: result.corrected || "",
      hindi: result.hindi || "",
      suggestions: result.suggestions || [],
      grammarRules: result.grammarRules || []
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
from .llama3_integration import Llama3Analyzer
from .whisper_transcriber import WhisperTranscriber
import spacy

class FeedbackAnalyzer:
    def __init__(self):
        self.llm = Llama3Analyzer()  # Llama3 for feedback generation
        self.transcriber = WhisperTranscriber(model_name="base")  # Whisper for transcription
        self.nlp = spacy.load("en_core_web_sm")  # spaCy for linguistic analysis

    def _get_spacy_stats(self, text: str) -> dict:
        """Calculate spaCy statistics for the given text."""
        try:
            doc = self.nlp(text)
            tokens = [{"text": token.text, "pos": token.pos_} for token in doc]
            entities = [{"text": ent.text, "label": ent.label_} for ent in doc.ents]
            readability = {
                "flesch_reading_ease": doc._.flesch_reading_ease if hasattr(doc._, "flesch_reading_ease") else None,
                "avg_sentence_length": sum(len(sent) for sent in doc.sents) / len(list(doc.sents)) if len(list(doc.sents)) > 0 else 0
            }
            sentiment = {
                "polarity": doc._.polarity if hasattr(doc._, "polarity") else None,
                "subjectivity": doc._.subjectivity if hasattr(doc._, "subjectivity") else None
            }
            return {
                "num_tokens": len(doc),
                "tokens": tokens,
                "named_entities": entities,
                "readability": readability,
                "sentiment": sentiment
            }
        except Exception as e:
            return {"error": f"Error calculating spaCy stats: {str(e)}"}

    def analyze_feedback(self, speech_text: str, spacy_stats: dict) -> dict:
        """Generate feedback based on the speech text and spaCy statistics."""
        try:
            # Step 1: Generate feedback using Llama3
            prompt = (
                f"Speech: {speech_text}\n\n"
                f"spaCy Stats: {spacy_stats}\n\n"
                "Analyze this speech and provide feedback on pronunciation, tone, and clarity. "
                "Suggest areas for improvement and practical exercises."
            )
            feedback = self.llm.analyze(prompt)

            return {
                "speech_text": speech_text,
                "spacy_stats": spacy_stats,
                "feedback": feedback
            }
        except Exception as e:
            return {"error": f"Error generating feedback: {str(e)}"}

    def process_audio(self, audio_path: str) -> dict:
        """Process the audio file and return transcription, spaCy stats, and feedback."""
        try:
            # Step 1: Transcribe audio to text
            transcribed_text = self.transcriber.transcribe(audio_path)

            # Step 2: Calculate spaCy statistics
            spacy_stats = self._get_spacy_stats(transcribed_text)

            # Step 3: Generate feedback
            return self.analyze_feedback(transcribed_text, spacy_stats)
        except Exception as e:
            return {"error": f"Error processing audio: {str(e)}"}
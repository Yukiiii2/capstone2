import spacy
from .whisper_transcriber import WhisperTranscriber

class SpacyAudioAnalyzer:
    def __init__(self, whisper_model="base", spacy_model="en_core_web_sm"):
        self.transcriber = WhisperTranscriber(model_name=whisper_model)
        self.nlp = spacy.load(spacy_model)

    def analyze_audio(self, audio_path):
        # Step 1: Transcribe audio to text
        text = self.transcriber.transcribe(audio_path)
        # Step 2: Analyze text with spaCy
        doc = self.nlp(text)
        entities = [(ent.text, ent.label_) for ent in doc.ents]
        pos_tags = [(token.text, token.pos_) for token in doc]
        return {
            "transcribed_text": text,
            "entities": entities,
            "pos_tags": pos_tags,
            "num_tokens": len(doc)
        }

# Example usage:
# analyzer = SpacyAudioAnalyzer()
# result = analyzer.analyze_audio("audio.wav")
# print(result)
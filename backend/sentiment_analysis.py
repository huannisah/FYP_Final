from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from typing import Dict
import logging

logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    
    def __init__(self):
        #initialise the sentiment analszer
        self.analyzer = SentimentIntensityAnalyzer()
        
        # Sentiment thresholds
        self.POSITIVE_THRESHOLD = 0.05
        self.NEGATIVE_THRESHOLD = -0.05
        self.CRISIS_THRESHOLD = -0.7  # if it is a very negative sentiment
        
    def analyze(self, text: str) -> Dict[str, any]:
        """Args:
            text: Input text to analyse
            
        Returns:
            Dictionary containing sentiment scores and label
        """
        if not text or not text.strip():
            return self._empty_result()
            
        try:
            # Get VADER scores
            scores = self.analyzer.polarity_scores(text)
            
            # Determine sentiment label
            compound = scores['compound']
            if compound >= self.POSITIVE_THRESHOLD:
                label = 'positive'
            elif compound <= self.NEGATIVE_THRESHOLD:
                label = 'negative'
            else:
                label = 'neutral'
            
            # Check for crisis-level negative sentiment
            is_crisis_sentiment = compound <= self.CRISIS_THRESHOLD
            
            return {
                'compound': compound,
                'positive': scores['pos'],
                'negative': scores['neg'],
                'neutral': scores['neu'],
                'label': label,
                'is_crisis_sentiment': is_crisis_sentiment
            }
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {str(e)}")
            return self._empty_result()
    
    def _empty_result(self) -> Dict[str, any]:
        """Return empty result for error cases"""
        return {
            'compound': 0.0,
            'positive': 0.0,
            'negative': 0.0,
            'neutral': 1.0,
            'label': 'neutral',
            'is_crisis_sentiment': False
        }

# Global instance
sentiment_analyzer = SentimentAnalyzer()
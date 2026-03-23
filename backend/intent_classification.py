from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from typing import Dict
import logging
import os

logger = logging.getLogger(__name__)


class IntentClassifier:
    # Define intent categories
    INTENTS = {
        'emotional_support': 'User seeks empathy, validation, or emotional comfort',
        'coping_strategies': 'User requests techniques or strategies for managing symptoms',
        'information_seeking': 'User asks about mental health conditions, resources, or general information',
        'symptom_reporting': 'User describes their mental health symptoms or experiences',
        'crisis': 'User expresses thoughts of self-harm, suicide, or immediate danger',
        'general_conversation': 'Casual conversation, greetings, or small talk',
        'feedback': 'User provides feedback about the chatbot or conversation'
    }
    
    def __init__(self):
        #Initialise intent classifier
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.0,  # Deterministic for classification
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # Create classification prompt
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self._get_system_prompt()),
            ("user", "{text}")
        ])
        
        self.chain = self.prompt | self.llm
    
    def _get_system_prompt(self) -> str:
        """Get system prompt for intent classification"""
        intent_descriptions = "\n".join([
            f"- {intent}: {desc}" 
            for intent, desc in self.INTENTS.items()
        ])
        
        return f"""You are an intent classifier for a mental health support chatbot. 
Analyze the user's message and classify it into ONE of the following intents:

{intent_descriptions}

Respond with ONLY the intent category name (e.g., 'emotional_support', 'crisis', etc.).
If the message expresses thoughts of self-harm or suicide, ALWAYS classify as 'crisis'.
"""
    
    def classify(self, text: str) -> Dict[str, any]:
        """
        Classify user intent from text
        
        Args:
            text: User message to classify
            
        Returns:
            Dictionary containing intent and confidence
        """
        if not text or not text.strip():
            return {'intent': 'general_conversation', 'confidence': 1.0}
        
        try:
            # Get classification from LLM
            response = self.chain.invoke({"text": text})
            intent = response.content.strip().lower()
            
            # Validate intent
            if intent not in self.INTENTS:
                # Fallback to general conversation
                intent = 'general_conversation'
                logger.warning(f"Unknown intent returned: {intent}, using fallback")
            
            # Additional crisis keyword detection
            crisis_keywords = self._check_crisis_keywords(text)
            if crisis_keywords:
                intent = 'crisis'
            
            return {
                'intent': intent,
                'confidence': 1.0,  # LLM classification assumed high confidence
                'description': self.INTENTS[intent],
                'crisis_keywords': crisis_keywords if crisis_keywords else None
            }
            
        except Exception as e:
            logger.error(f"Error in intent classification: {str(e)}")
            return {
                'intent': 'general_conversation',
                'confidence': 0.0,
                'description': self.INTENTS['general_conversation'],
                'crisis_keywords': None
            }
    
    def _check_crisis_keywords(self, text: str) -> list:
        #Check for explicit crisis keywords
        """
        Args:
            text: Text to check
            
        Returns:
            List of detected crisis keywords
        """
        crisis_patterns = [
            'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
            'better off dead', 'no reason to live', 'self harm', 'self-harm',
            'cut myself', 'hurt myself', 'end it all', 'not worth living'
        ]
        
        text_lower = text.lower()
        detected = [keyword for keyword in crisis_patterns if keyword in text_lower]
        
        return detected if detected else None


# Global instance
intent_classifier = IntentClassifier()

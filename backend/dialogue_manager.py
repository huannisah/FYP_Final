from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
import logging
import os

logger = logging.getLogger(__name__)

class DialogueManager:
    """Manages conversation flow and response generation"""
    
    def __init__(self):
        
        self.crisis_resources = """
        
IMMEDIATE HELP AVAILABLE:

If you're in crisis or having thoughts of harming yourself, please reach out immediately:

• National Mindline Hotline: 1771 (24/7)
• Samaritans of Singapore: 1767 (24/7)
• NTU Psychological Crisis Hotline: 6790 4462
• Singapore Association for Mental Health: 1800 283 7019

You can also go to the nearest hospital emergency department.

You matter, and there are people who want to help you through this.
"""
    
    def create_response_prompt(
        self,
        intent: str,
        sentiment: str,
        retrieved_context: str = "",
    ) -> ChatPromptTemplate:
        """
        Create appropriate prompt based on intent, sentiment, and optional RAG context.

        Args:
            intent: Detected user intent
            sentiment: Detected sentiment (positive/negative/neutral)
            retrieved_context: Optional context from RAG knowledge base

        Returns:
            ChatPromptTemplate configured for the context
        """
        base_instructions = """You are a supportive mental health chatbot designed to provide emotional support and guidance.

Your role:
- Provide empathetic, non-judgmental support
- Use active listening and validation techniques-
- Suggest evidence-based coping strategies when appropriate
- Encourage professional help when needed
- Never diagnose or provide medical advice
- Maintain a warm, supportive tone

FORMATTING: Respond like a warm, caring human counsellor speaking naturally. Write in flowing conversational paragraphs only.
Do not use numbered lists, bullet points, bold text, headers, or any markdown formatting. If you have multiple suggestions,
weave them naturally into your sentences using words like "one thing you could try is...", "another approach might be...", "you could also...".

IMPORTANT: You are NOT a replacement for professional mental health care. Always remind users to seek professional help for serious concerns.
"""
        if retrieved_context and retrieved_context.strip():
            base_instructions += """

The following is relevant information from the knowledge base. Use it to inform your response when helpful. Do not simply repeat it; weave it 
naturally into your support. If it does not fit the user's question, you may omit it.
\n Knowledge base: \n"""
            base_instructions += retrieved_context.strip()
            base_instructions += "\n This is the end of the knowledge base \n"
        
        # Add intent-specific guidance
        intent_guidance = {
            'emotional_support': """
The user is seeking emotional support. Focus on:
- Validating their feelings
- Showing empathy and understanding
- Avoiding toxic positivity or dismissing their concerns
- Asking open-ended questions to understand their situation better
""",
            'coping_strategies': """
The user is requesting coping strategies. Provide:
- Evidence-based techniques (breathing exercises, grounding, mindfulness)
- Practical, actionable steps they can take now
- Multiple options they can choose from
- Encouragement to try what feels right for them
""",
            'information_seeking': """
The user is seeking information. Provide:
- Accurate, factual information about mental health
- Clear explanations without overwhelming detail
- Resources for further learning
- Reminder that you're not providing diagnosis
""",
            'symptom_reporting': """
The user is describing symptoms. Respond with:
- Acknowledgment of what they're experiencing
- Validation that these feelings are real and matter
- Gentle suggestion to track symptoms and speak with a professional
- Immediate coping strategies for symptom management
""",
            'general_conversation': """
Engage in friendly, supportive conversation while:
- Maintaining professional boundaries
- Being warm and personable
- Gently guiding back to mental health support if appropriate
""",
            'feedback': """
The user is providing feedback. Respond with:
- Gratitude for their input
- Acknowledgment of their experience
- Commitment to improvement
"""
        }
        
        # Add sentiment-specific guidance
        sentiment_guidance = {
            'negative': "The user appears to be experiencing negative emotions. Be extra gentle, validating, and supportive.",
            'positive': "The user appears to be in a positive state. Acknowledge this while remaining supportive.",
            'neutral': "The user's emotional state appears neutral. Maintain a warm, supportive tone."
        }
        
        system_message = base_instructions
        if intent in intent_guidance:
            system_message += intent_guidance[intent]
        if sentiment in sentiment_guidance:
            system_message += "\n" + sentiment_guidance[sentiment]
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_message),
            MessagesPlaceholder(variable_name="chat_history"),
            ("user", "{input}")
        ])
        
        return prompt
    
    def _generate_crisis_response(self, user_message: str) -> str:
        """Generate immediate crisis response with resources"""
        
        response = f"""I'm really concerned about what you've shared. Your safety is the most important thing right now.
{self.crisis_resources}

I'm here to listen if you want to talk, but please reach out to one of these professional services immediately. They have trained counselors who can provide the help you need right now.

Would you like to talk about what's going on? I'm listening, but I really encourage you to contact one of the crisis services above."""
        
        return response


# Global instance
dialogue_manager = DialogueManager()

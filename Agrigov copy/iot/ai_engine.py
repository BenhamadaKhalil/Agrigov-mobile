import json
from groq import Groq
from django.conf import settings
from django.utils import timezone


class AgriAIAdvisor:
    """Agricultural AI Advisor - 100% Groq AI Powered"""
    
    def __init__(self, api_key=None):
        self.api_key = api_key or getattr(settings, 'GROQ_API_KEY', None)
        self.client = Groq(api_key=self.api_key) if self.api_key else None
    
    def analyze(self, sensor_data, history_stats, farm, weather_data=None):
        """
        Always generates fresh AI recommendations.
        No fallback, no static data.
        """
        if not self.client:
            raise Exception("Groq API key not configured. Add GROQ_API_KEY to settings.py")
        
        prompt = self._build_prompt(sensor_data, history_stats, farm)
        
        # Try up to 3 times if API fails
        for attempt in range(3):
            try:
                response = self.client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[
                        {
                            "role": "system", 
                            "content": (
                                "You are an expert agricultural advisor for farmers in Algeria. "
                                "Analyze sensor data and provide practical, actionable recommendations. "
                                "Always respond with ONLY valid JSON, no markdown, no explanations."
                            )
                        },
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=600
                )
                
                result_text = response.choices[0].message.content
                return self._parse_response(result_text)
                
            except Exception as e:
                print(f"AI attempt {attempt + 1} failed: {e}")
                if attempt == 2:  # Last attempt
                    raise Exception(f"AI service unavailable after 3 attempts: {e}")
        
        raise Exception("AI service unavailable")
    
    def _build_prompt(self, sensor_data, history_stats, farm):
        """Build detailed prompt for best AI response"""
        
        temp = sensor_data.temperature if sensor_data else 'N/A'
        humidity = sensor_data.humidity if sensor_data else 'N/A'
        soil = sensor_data.soil_moisture if sensor_data else 'N/A'
        
        return f"""Analyze this Algerian farm's real-time sensor data and provide 3-4 specific recommendations.

FARM DETAILS:
- Name: {farm.name}
- Location: {farm.wilaya}, Algeria
- Region: {getattr(farm, 'region', 'North Africa')}

CURRENT READINGS:
- Temperature: {temp}°C
- Humidity: {humidity}%
- Soil Moisture: {soil}%

DATE: {timezone.now().strftime('%B %d, %Y - %H:%M')}

INSTRUCTIONS:
1. Analyze EACH sensor value against agricultural standards
2. Identify problems (if any) and their severity
3. Give practical actions the farmer can take TODAY
4. Suggest weekly planning/preparation

IMPORTANT RULES:
- If soil moisture is under 20%, this is CRITICAL - crops need water urgently
- If temperature is over 35°C, heat stress is a real danger
- If humidity is over 80% with warm temperature, fungal disease risk is HIGH
- If all values are normal, say so and suggest preventive maintenance
- Be specific about what the farmer should DO, not just what's wrong
- Use simple, clear language (many Algerian farmers speak Arabic/French as first language)

Return ONLY this exact JSON structure:
{{
    "overall_status": "good" or "warning" or "critical",
    "summary": "One sentence summarizing overall farm conditions",
    "recommendations": [
        {{
            "priority": "high" or "medium" or "low",
            "category": "irrigation/disease/pest/heat/frost/soil/fertilizer/harvest/general",
            "icon": "one emoji that represents this",
            "title": "Short actionable title (max 6 words)",
            "description": "2-3 sentences explaining the situation and why it matters",
            "action_today": "Specific action to take immediately today",
            "action_week": "What to plan for this coming week",
            "risk": "What could happen if this is ignored (or null if no risk)"
        }}
    ]
}}"""
    
    def _parse_response(self, text):
        """Parse AI response - always returns valid JSON"""
        try:
            clean_text = text.strip()
            
            # Remove markdown code blocks if present
            if clean_text.startswith('```json'):
                clean_text = clean_text[7:]
            elif clean_text.startswith('```'):
                clean_text = clean_text[3:]
            if clean_text.endswith('```'):
                clean_text = clean_text[:-3]
            
            clean_text = clean_text.strip()
            
            result = json.loads(clean_text)
            
            # Validate required fields
            if 'overall_status' not in result:
                raise ValueError("Missing overall_status")
            if 'recommendations' not in result:
                raise ValueError("Missing recommendations")
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"Failed to parse AI response: {text[:200]}...")
            raise Exception(f"AI returned invalid JSON: {e}")
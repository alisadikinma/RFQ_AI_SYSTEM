/**
 * AI Assistant System Prompt
 * Helps users determine required test stations through natural conversation
 */

// Station inference rules based on product features
export const INFERENCE_RULES = `
### Station Inference Rules

Product Feature → Required Stations:
- WiFi/Bluetooth/4G/5G/RF components → RFT (Radio Frequency Test), CAL (Calibration)
- Touchscreen/Display/Buttons/UI → MMI (Man-Machine Interface Test)
- Firmware/Software/OS → OS_DOWNLOAD (Firmware Programming)
- Battery-powered/Li-ion → CURRENT (Current Consumption Test)
- BGA components/Fine-pitch IC → UNDERFILL (BGA Underfill), consider AXI
- Sensors (accelerometer, gyro, proximity, temp) → CAL (Calibration)
- High power dissipation (>5W) → T_GREASE (Thermal Grease Application)
- Visual quality critical → VISUAL (Visual Inspection)
- Audio speaker/microphone → AUDIO (Audio Test)
- Camera module → CAMERA (Camera Test)
- NFC capability → NFC (NFC Test)
- GPS module → GPS (GPS Test)
- USB/Charging port → USB (USB Test)
- All products → MBT (Manual Bench Test) as baseline

### Product Type Templates

Common station sets by product type:
- **Smartphone**: MBT, CAL, RFT, MMI, OS_DOWNLOAD, CURRENT, VISUAL, UNDERFILL, AUDIO, CAMERA
- **IoT Device**: MBT, CAL, RFT, OS_DOWNLOAD, CURRENT
- **Wearable (Smartwatch)**: MBT, CAL, RFT, MMI, OS_DOWNLOAD, CURRENT, VISUAL
- **Tablet**: MBT, CAL, RFT, MMI, OS_DOWNLOAD, CURRENT, VISUAL, UNDERFILL
- **Power Bank**: MBT, CURRENT, VISUAL
- **Router/Modem**: MBT, CAL, RFT, OS_DOWNLOAD
- **TWS Earbuds**: MBT, CAL, RFT, AUDIO, CURRENT, OS_DOWNLOAD
- **Smart Speaker**: MBT, CAL, RFT, AUDIO, OS_DOWNLOAD, CURRENT
`;

// Build the full system prompt with station list
export function buildAIAssistantPrompt(stationList: string): string {
  return `You are an AI Assistant for an EMS (Electronics Manufacturing Services) RFQ system.
Your role is to help users determine what test stations they need for their new products through natural conversation.

## YOUR KNOWLEDGE

### Available Test Stations
${stationList}

${INFERENCE_RULES}

## YOUR BEHAVIOR

1. **Be conversational** - Chat naturally in Bahasa Indonesia (with some English technical terms)
2. **Ask clarifying questions** - Don't assume too much. Ask about:
   - BGA components on PCB?
   - Battery-powered?
   - What sensors?
   - Display type?
   - RF features (WiFi, Bluetooth, 4G/5G)?
3. **Explain your reasoning** - Tell user WHY each station is needed
4. **Be helpful** - If user is confused, guide them step by step
5. **Summarize clearly** - Present final station list in a structured format
6. **Offer actions** - When requirements are clear, offer to search similar models

## RESPONSE FORMAT

You MUST respond with a valid JSON object containing these fields:
{
  "message": "Your conversational response text here",
  "suggestedStations": [
    { "code": "MBT", "name": "Manual Bench Test", "reason": "Baseline testing for all products" }
  ],
  "actionButtons": [
    { "id": "use", "label": "Gunakan Rekomendasi", "action": "use_stations" },
    { "id": "search", "label": "Cari Model Serupa", "action": "search_models" }
  ],
  "isComplete": false,
  "needsClarification": ["question1", "question2"]
}

Rules for JSON response:
- "message": Always include a friendly conversational message
- "suggestedStations": Include when you have station recommendations. Set to null or empty array if no recommendations yet.
- "actionButtons": Include when user has confirmed or you're confident about stations. Set to null if still gathering info.
- "isComplete": true when conversation has reached a clear conclusion with confirmed stations
- "needsClarification": List of questions you're asking (helps track conversation progress)

## CONVERSATION FLOW

1. **Opening**: Greet user, ask about their product
2. **Discovery**: Ask clarifying questions about features
3. **Recommendation**: Present station list with reasons
4. **Confirmation**: Ask if they want to add/remove anything
5. **Action**: Offer to search similar models or confirm stations

## IMPORTANT NOTES

- ALWAYS respond in valid JSON format
- Use Bahasa Indonesia for conversational text
- Use English for technical terms (station codes, product names)
- Be concise but helpful
- If user input is unclear, ask for clarification
- Don't make up station codes - only use codes from the provided list
`;
}

// Default station list (will be replaced with actual DB data)
export const DEFAULT_STATION_LIST = `
- MBT: Manual Bench Test - Basic functional testing at workstation
- CAL: Calibration - RF and sensor calibration
- RFT: Radio Frequency Test - WiFi, Bluetooth, 4G/5G testing
- MMI: Man-Machine Interface - Touch, display, button testing
- OS_DOWNLOAD: Firmware Programming - Flash firmware/OS to device
- CURRENT: Current Test - Power consumption measurement
- VISUAL: Visual Inspection - Manual or automated visual check
- UNDERFILL: Underfill - BGA underfill application
- AXI: Automated X-Ray Inspection - BGA/QFN solder inspection
- AOI: Automated Optical Inspection - Solder and component inspection
- ICT: In-Circuit Test - Board-level electrical testing
- FCT: Functional Circuit Test - Full functional testing
- AUDIO: Audio Test - Speaker and microphone testing
- CAMERA: Camera Test - Camera module testing
- NFC: NFC Test - Near-field communication testing
- GPS: GPS Test - GPS/GNSS module testing
- USB: USB Test - USB connectivity testing
- T_GREASE: Thermal Grease - Thermal interface material application
- CONFORMAL: Conformal Coating - Protective coating application
- PACKING: Packing - Final packaging operation
`;

// Helper to extract stations from conversation
export function extractStationsFromConversation(messages: Array<{
  role: string;
  suggestedStations?: Array<{ code: string; name: string; reason: string }>;
}>): string[] {
  // Find last AI message with suggested stations
  const lastAIMessage = [...messages]
    .reverse()
    .find(m => m.role === 'assistant' && m.suggestedStations && m.suggestedStations.length > 0);

  if (lastAIMessage?.suggestedStations) {
    return lastAIMessage.suggestedStations.map(s => s.code);
  }

  return [];
}

// Parse AI response to extract structured data
export interface ParsedAIResponse {
  message: string;
  suggestedStations?: Array<{ code: string; name: string; reason: string }>;
  actionButtons?: Array<{ id: string; label: string; action: string }>;
  isComplete: boolean;
  needsClarification?: string[];
}

export function parseAIResponse(content: string): ParsedAIResponse {
  try {
    // Try direct JSON parse
    const parsed = JSON.parse(content);
    return {
      message: parsed.message || content,
      suggestedStations: parsed.suggestedStations || undefined,
      actionButtons: parsed.actionButtons || undefined,
      isComplete: parsed.isComplete || false,
      needsClarification: parsed.needsClarification || undefined,
    };
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        return {
          message: parsed.message || content,
          suggestedStations: parsed.suggestedStations || undefined,
          actionButtons: parsed.actionButtons || undefined,
          isComplete: parsed.isComplete || false,
          needsClarification: parsed.needsClarification || undefined,
        };
      } catch {
        // Fall through to default
      }
    }

    // Try to find JSON object in response
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        const parsed = JSON.parse(objectMatch[0]);
        return {
          message: parsed.message || content,
          suggestedStations: parsed.suggestedStations || undefined,
          actionButtons: parsed.actionButtons || undefined,
          isComplete: parsed.isComplete || false,
          needsClarification: parsed.needsClarification || undefined,
        };
      } catch {
        // Fall through to default
      }
    }

    // Return as plain message if JSON parsing fails
    return {
      message: content,
      isComplete: false,
    };
  }
}

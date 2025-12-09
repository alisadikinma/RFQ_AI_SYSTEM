/**
 * RFQ Agent Prompts - INTELLIGENT VERSION
 * Smart prompts that recognize product types and auto-suggest stations
 */

/**
 * Main system prompt for RFQ Agent - MUCH SMARTER
 */
export const RFQ_AGENT_SYSTEM_PROMPT = `Kamu adalah RFQ Assistant yang CERDAS dan HELPFUL untuk manufaktur EMS (Electronic Manufacturing Services).

## ATURAN PENTING:
1. JANGAN tanya pertanyaan bodoh yang sudah obvious dari konteks
2. Kalau user sebut TIPE PRODUK, langsung kasih rekomendasi station
3. Kalau user bilang "gak tau" atau "tidak yakin", berikan DEFAULT yang reasonable
4. GUIDE user, bukan INTERROGATE
5. Bahasa Indonesia yang ramah dan profesional

## PRODUCT TYPE RECOGNITION:

### Smartphone/HP (Xiaomi, Samsung, iPhone, dll):
SELALU butuh: RFT (4G/5G/WiFi/BLE), CAL (sensor), MMI (touchscreen), OS_DOWNLOAD, CURRENT_TESTING, VISUAL, CAMERA_TEST
Mungkin butuh: NFC_TEST, WIRELESS_CHARGING, FINGERPRINT

### IoT/Smart Device (sensor, tracker, smart home):
SELALU butuh: RFT (WiFi/BLE), CAL (sensor), OS_DOWNLOAD, CURRENT_TESTING
Mungkin butuh: MMI (jika ada LED/button)

### Wearable (smartwatch, band):
SELALU butuh: RFT (BLE), CAL (heart rate, accelerometer), MMI (display), CURRENT_TESTING, VISUAL

### Router/Networking:
SELALU butuh: RFT (WiFi 2.4/5G/6E), CURRENT_TESTING, OS_DOWNLOAD, FCT

### Automotive Electronics:
SELALU butuh: EMC_TEST, VIBRATION, THERMAL_CYCLING, FCT, ICT, VISUAL

### Consumer Electronics (TV, speaker, dll):
SELALU butuh: FCT, VISUAL, mungkin MMI, mungkin RFT (smart TV)

## RESPONSE FORMAT:

Kalau user sebut produk, LANGSUNG berikan rekomendasi:

"Untuk [PRODUK], saya rekomendasikan:

✅ **RFT** - RF test untuk [WiFi/BLE/4G/5G]
✅ **CAL** - Kalibrasi [sensor yang relevan]
✅ **MMI** - Test [touchscreen/display/button]
✅ **OS_DOWNLOAD** - Flash firmware
✅ **CURRENT_TESTING** - Power consumption
✅ **VISUAL** - Inspeksi kosmetik

Apakah ada fitur tambahan seperti [NFC/wireless charging/fingerprint]?
Atau langsung lanjut dengan rekomendasi ini?"

## JANGAN PERNAH:
- Tanya "Apa jenis konektivitas?" kalau user sudah bilang HP/smartphone
- Tanya "Apakah ada sensor?" kalau sudah jelas dari tipe produk
- Kasih list pertanyaan panjang tanpa rekomendasi
- Ulangi pertanyaan yang sama

## KALAU USER BILANG "GAK TAU":
Berikan DEFAULT reasonable berdasarkan tipe produk, jangan tanya lagi!

## TEST STATIONS REFERENCE:
- MBT: Manual Bench Test - rework, repair
- CAL: Calibration - sensor kalibrasi (temp, accel, gyro, proximity, ambient light)
- CAL1, CAL2: Calibration stage 1 & 2
- RFT: RF Test - WiFi, BLE, cellular (2G/3G/4G/5G), GPS, NFC
- RFT1, RFT2: RF Test stage 1 & 2
- MMI: Man-Machine Interface - touchscreen, display, button, speaker, mic
- VISUAL: Inspeksi visual / kosmetik
- OS_DOWNLOAD: Flash firmware/BIOS/OS
- CURRENT_TESTING: Power consumption measurement
- ICT: In-Circuit Test - component level
- FCT: Functional Circuit Test
- AOI: Automated Optical Inspection
- CAMERA_TEST/CAMERA_CAL: Kalibrasi kamera
- NFC_TEST: NFC testing
- FINGERPRINT: Fingerprint sensor test
- UNDERFILL: BGA underfill
- T_GREASE: Thermal paste
- SHIELDING_COVER: RF shield assembly
- 5G仪表/5G instrumentation: 5G RF testing
- 4G仪表/4G instrumentation: 4G RF testing
- WIFIBT: WiFi + Bluetooth combined test`;

/**
 * Prompt template for station inference - SMARTER
 */
export const STATION_INFERENCE_PROMPT = `Analisis produk berikut dan rekomendasikan test stations:

PRODUK: {{DESCRIPTION}}

INSTRUKSI:
1. Identifikasi TIPE PRODUK (smartphone, IoT, wearable, router, automotive, dll)
2. Berdasarkan tipe, berikan station yang PASTI dibutuhkan
3. Tambahkan station opsional berdasarkan fitur spesifik

PRODUCT TYPE MAPPING:
- Smartphone/HP → RFT, CAL, MMI, OS_DOWNLOAD, CURRENT_TESTING, VISUAL, CAMERA_TEST
- IoT → RFT, CAL, OS_DOWNLOAD, CURRENT_TESTING
- Wearable → RFT, CAL, MMI, CURRENT_TESTING, VISUAL
- Router → RFT, OS_DOWNLOAD, FCT, CURRENT_TESTING
- Automotive → EMC, VIBRATION, FCT, ICT, VISUAL

Response dalam JSON:
{
  "product_type": "tipe produk yang terdeteksi",
  "analysis": "analisis singkat",
  "stations": [
    {
      "code": "STATION_CODE",
      "name": "Full Name",
      "reason": "Alasan dalam Bahasa Indonesia",
      "confidence": "high" | "medium" | "low"
    }
  ]
}`;

/**
 * Quick inference mapping for common product types - EXPANDED
 */
export const PRODUCT_TYPE_STATIONS: Record<string, string[]> = {
  // Smartphones
  'smartphone': ['RFT', 'CAL', 'MMI', 'OS_DOWNLOAD', 'CURRENT_TESTING', 'VISUAL', 'CAMERA_TEST'],
  'hp': ['RFT', 'CAL', 'MMI', 'OS_DOWNLOAD', 'CURRENT_TESTING', 'VISUAL', 'CAMERA_TEST'],
  'handphone': ['RFT', 'CAL', 'MMI', 'OS_DOWNLOAD', 'CURRENT_TESTING', 'VISUAL', 'CAMERA_TEST'],
  'phone': ['RFT', 'CAL', 'MMI', 'OS_DOWNLOAD', 'CURRENT_TESTING', 'VISUAL', 'CAMERA_TEST'],
  'xiaomi': ['RFT', 'CAL', 'MMI', 'OS_DOWNLOAD', 'CURRENT_TESTING', 'VISUAL', 'CAMERA_TEST', 'MBT'],
  'samsung': ['RFT', 'CAL', 'MMI', 'OS_DOWNLOAD', 'CURRENT_TESTING', 'VISUAL', 'CAMERA_TEST'],
  'iphone': ['RFT', 'CAL', 'MMI', 'OS_DOWNLOAD', 'CURRENT_TESTING', 'VISUAL', 'CAMERA_TEST'],
  'oppo': ['RFT', 'CAL', 'MMI', 'OS_DOWNLOAD', 'CURRENT_TESTING', 'VISUAL', 'CAMERA_TEST'],
  'vivo': ['RFT', 'CAL', 'MMI', 'OS_DOWNLOAD', 'CURRENT_TESTING', 'VISUAL', 'CAMERA_TEST'],
  'realme': ['RFT', 'CAL', 'MMI', 'OS_DOWNLOAD', 'CURRENT_TESTING', 'VISUAL', 'CAMERA_TEST'],

  // IoT
  'iot': ['RFT', 'CAL', 'OS_DOWNLOAD', 'CURRENT_TESTING'],
  'sensor': ['CAL', 'CURRENT_TESTING', 'FCT'],
  'tracker': ['RFT', 'CAL', 'OS_DOWNLOAD', 'CURRENT_TESTING'],
  'smart home': ['RFT', 'OS_DOWNLOAD', 'CURRENT_TESTING', 'FCT'],

  // Wearables
  'wearable': ['RFT', 'CAL', 'MMI', 'CURRENT_TESTING', 'VISUAL'],
  'smartwatch': ['RFT', 'CAL', 'MMI', 'CURRENT_TESTING', 'VISUAL'],
  'watch': ['RFT', 'CAL', 'MMI', 'CURRENT_TESTING', 'VISUAL'],
  'band': ['RFT', 'CAL', 'CURRENT_TESTING', 'VISUAL'],
  'earbuds': ['RFT', 'CAL', 'CURRENT_TESTING', 'VISUAL'],
  'tws': ['RFT', 'CAL', 'CURRENT_TESTING', 'VISUAL'],

  // Networking
  'router': ['RFT', 'OS_DOWNLOAD', 'FCT', 'CURRENT_TESTING'],
  'modem': ['RFT', 'OS_DOWNLOAD', 'FCT', 'CURRENT_TESTING'],
  'access point': ['RFT', 'OS_DOWNLOAD', 'FCT', 'CURRENT_TESTING'],

  // Automotive
  'automotive': ['EMC_TEST', 'VIBRATION', 'THERMAL', 'FCT', 'ICT', 'VISUAL'],
  'car': ['EMC_TEST', 'VIBRATION', 'THERMAL', 'FCT', 'ICT', 'VISUAL'],
  'vehicle': ['EMC_TEST', 'VIBRATION', 'THERMAL', 'FCT', 'ICT', 'VISUAL'],

  // Consumer electronics
  'tv': ['FCT', 'VISUAL', 'MMI'],
  'speaker': ['CAL', 'FCT', 'VISUAL'],
  'camera': ['CAL', 'FCT', 'VISUAL', 'CAMERA_TEST'],
};

/**
 * Quick inference mapping for features/components
 */
export const QUICK_INFERENCE_MAP: Record<string, string[]> = {
  // Connectivity
  'wifi': ['RFT'],
  'bluetooth': ['RFT'],
  'ble': ['RFT'],
  '4g': ['RFT'],
  '5g': ['RFT'],
  'lte': ['RFT'],
  'nfc': ['RFT', 'NFC_TEST'],
  'gps': ['RFT', 'CAL'],

  // Input/Output
  'touchscreen': ['MMI'],
  'display': ['MMI'],
  'lcd': ['MMI'],
  'oled': ['MMI'],
  'amoled': ['MMI'],
  'button': ['MMI'],
  'speaker': ['MMI', 'CAL'],
  'microphone': ['MMI', 'CAL'],
  'mic': ['MMI', 'CAL'],
  'camera': ['CAMERA_TEST', 'CAL'],
  'kamera': ['CAMERA_TEST', 'CAL'],

  // Sensors
  'sensor': ['CAL'],
  'temperature': ['CAL'],
  'humidity': ['CAL'],
  'pressure': ['CAL'],
  'accelerometer': ['CAL'],
  'gyroscope': ['CAL'],
  'proximity': ['CAL'],
  'ambient light': ['CAL'],
  'fingerprint': ['FINGERPRINT'],

  // Power
  'battery': ['CURRENT_TESTING'],
  'baterai': ['CURRENT_TESTING'],
  'power': ['CURRENT_TESTING'],
  'charging': ['CURRENT_TESTING'],
  'wireless charging': ['WIRELESS_CHARGING', 'CURRENT_TESTING'],

  // Processing
  'mcu': ['OS_DOWNLOAD', 'MBT'],
  'processor': ['OS_DOWNLOAD'],
  'firmware': ['OS_DOWNLOAD'],

  // Assembly
  'bga': ['UNDERFILL'],
  'thermal': ['T_GREASE'],
  'shielding': ['SHIELDING_COVER'],
  'outdoor': ['CONFORMAL_COATING'],
  'waterproof': ['CONFORMAL_COATING'],
  'ip67': ['CONFORMAL_COATING'],
  'ip68': ['CONFORMAL_COATING'],
};

/**
 * Station definitions for reference
 */
export const STATION_DEFINITIONS: Record<string, { name: string; description: string; category: string }> = {
  'MBT': { name: 'Manual Bench Test', description: 'Manual testing dan rework', category: 'Testing' },
  'CAL': { name: 'Calibration', description: 'Kalibrasi sensor', category: 'Testing' },
  'CAL1': { name: 'Calibration Stage 1', description: 'Kalibrasi tahap 1', category: 'Testing' },
  'CAL2': { name: 'Calibration Stage 2', description: 'Kalibrasi tahap 2', category: 'Testing' },
  'RFT': { name: 'RF Test', description: 'Test RF (WiFi/BLE/Cellular)', category: 'Testing' },
  'RFT1': { name: 'RF Test Stage 1', description: 'RF test tahap 1', category: 'Testing' },
  'RFT2': { name: 'RF Test Stage 2', description: 'RF test tahap 2', category: 'Testing' },
  'MMI': { name: 'Man-Machine Interface', description: 'Test UI (touchscreen, button, display)', category: 'Testing' },
  'VISUAL': { name: 'Visual Inspection', description: 'Inspeksi visual/kosmetik', category: 'Testing' },
  'OS_DOWNLOAD': { name: 'OS Download', description: 'Flash firmware/OS', category: 'Testing' },
  'CURRENT_TESTING': { name: 'Current Testing', description: 'Test power consumption', category: 'Testing' },
  'ICT': { name: 'In-Circuit Test', description: 'Test komponen PCB', category: 'Testing' },
  'FCT': { name: 'Functional Circuit Test', description: 'Test fungsi circuit', category: 'Testing' },
  'AOI': { name: 'Automated Optical Inspection', description: 'Inspeksi otomatis PCB', category: 'Testing' },
  'CAMERA_TEST': { name: 'Camera Test', description: 'Test dan kalibrasi kamera', category: 'Testing' },
  'NFC_TEST': { name: 'NFC Test', description: 'Test NFC', category: 'Testing' },
  'FINGERPRINT': { name: 'Fingerprint Test', description: 'Test fingerprint sensor', category: 'Testing' },
  'WIRELESS_CHARGING': { name: 'Wireless Charging Test', description: 'Test wireless charging', category: 'Testing' },
  'UNDERFILL': { name: 'Underfill', description: 'Underfill untuk BGA', category: 'Assembly' },
  'T_GREASE': { name: 'Thermal Grease', description: 'Aplikasi thermal paste', category: 'Assembly' },
  'SHIELDING_COVER': { name: 'Shielding Cover', description: 'Pemasangan RF shield', category: 'Assembly' },
  'WIFIBT': { name: 'WiFi + Bluetooth Test', description: 'Combined WiFi and BT test', category: 'Testing' },
  '5G仪表': { name: '5G Instrumentation', description: '5G RF testing', category: 'Testing' },
  '4G仪表': { name: '4G Instrumentation', description: '4G RF testing', category: 'Testing' },
  'EMC_TEST': { name: 'EMC Test', description: 'Electromagnetic compatibility', category: 'Testing' },
  'VIBRATION': { name: 'Vibration Test', description: 'Test ketahanan getaran', category: 'Testing' },
  'THERMAL': { name: 'Thermal Cycling', description: 'Test thermal cycling', category: 'Testing' },
  'CONFORMAL_COATING': { name: 'Conformal Coating', description: 'Protective coating', category: 'Assembly' },
};

/**
 * Prompt for extracting stations from conversation
 */
export const EXTRACT_STATIONS_PROMPT = `Dari percakapan berikut, ekstrak semua station yang telah disetujui:

## Percakapan:
{{CONVERSATION}}

## Format Response (JSON):
{
  "confirmed_stations": [
    { "code": "STATION_CODE", "name": "Full Name" }
  ]
}`;

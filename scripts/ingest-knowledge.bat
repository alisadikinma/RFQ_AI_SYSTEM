@echo off
REM Knowledge Base Ingest Script (Windows)
REM Usage: ingest-knowledge.bat <filename>

if "%1"=="" (
    echo Usage: ingest-knowledge.bat ^<filename^>
    echo.
    echo Available files:
    echo   - Manpower_Calculation_Formulas_for_EMS_and_PCB_Assembly_Lines.md
    echo   - EMS_Test_Line_Reference_Guide.md
    exit /b 1
)

set FILENAME=%1
set API_URL=http://localhost:3000/api/rag/ingest

echo.
echo === RFQ AI Knowledge Ingest ===
echo.
echo File: %FILENAME%
echo.

REM Check if file exists
if not exist "%FILENAME%" (
    echo ERROR: File not found: %FILENAME%
    exit /b 1
)

echo Reading file and sending to API...
echo.

REM Use PowerShell to read file and send as JSON
powershell -Command ^
    "$content = Get-Content -Raw '%FILENAME%' -Encoding UTF8; ^
     $body = @{ content = $content; filename = '%FILENAME%'; replace = $true } | ConvertTo-Json -Depth 10 -Compress; ^
     $response = Invoke-RestMethod -Uri '%API_URL%' -Method POST -Body $body -ContentType 'application/json'; ^
     Write-Host ''; ^
     if ($response.success) { ^
         Write-Host 'SUCCESS!' -ForegroundColor Green; ^
         Write-Host ('Chunks created: ' + $response.chunksCreated); ^
         Write-Host ('Total tokens: ' + $response.totalTokens); ^
     } else { ^
         Write-Host ('FAILED: ' + $response.error) -ForegroundColor Red; ^
     }"

echo.
echo Done!

@echo off
cd /d "%~dp0"
set LOG=%~dp0setup-log.txt
echo ===== Setup started at %DATE% %TIME% ===== > "%LOG%"
echo Installing root dependencies... >> "%LOG%"
npm install >> "%LOG%" 2>>&1
echo Installing server and client dependencies... >> "%LOG%"
npm run install-all >> "%LOG%" 2>>&1
echo Generating Prisma client... >> "%LOG%" 2>>&1
cd server
npx prisma generate >> "%LOG%" 2>>&1
echo ===== Setup completed at %DATE% %TIME% ===== >> "%LOG%"
pause >> "%LOG%" 2>>&1

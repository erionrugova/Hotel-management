@echo off
cd /d "%~dp0"
echo Installing root dependencies...
npm install
echo Installing server and client dependencies...
npm run install-all
echo Generating Prisma client...
cd server
npx prisma generate
echo Setup complete.
pause

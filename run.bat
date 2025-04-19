@echo off

:start
echo Logging in Bot...
npx ts-node index.ts

echo.
echo Bot has stopped.
echo.

:ask
set /p input="Do you want to restart the bot? (y/n): "
if /i "%input%"=="y" goto start
if /i "%input%"=="n" goto end
echo Invalid input. Please enter 'y' or 'n'.
goto ask

:end
echo Exiting...
pause

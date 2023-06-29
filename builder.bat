@echo off
set /p "webhook=Enter webhook: "
set /p "name=Enter name: "
node build.js node.ico %webhook% %name%

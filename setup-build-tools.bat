@echo off
chcp 65001 >nul
echo ============================================
echo   安装 Visual Studio C++ 构建工具
echo   这是构建 Windows .exe 所需的一次性步骤
echo   需要管理员权限
echo ============================================
echo.

:: 检查是否以管理员运行
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 请右键此文件 → "以管理员身份运行"
    echo.
    pause
    exit /b 1
)

echo [1/2] 正在安装 C++ 构建工具（约需 5-10 分钟）...
"C:\Program Files (x86)\Microsoft Visual Studio\Installer\setup.exe" modify ^
    --installPath "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools" ^
    --add Microsoft.VisualStudio.Workload.VCTools ^
    --includeRecommended ^
    --passive ^
    --norestart

if %errorlevel% neq 0 (
    echo.
    echo [错误] 安装失败。请尝试手动安装：
    echo   1. 打开 https://visualstudio.microsoft.com/downloads/
    echo   2. 下载 "Visual Studio 2022 生成工具"
    echo   3. 安装时勾选 "使用 C++ 的桌面开发"
    pause
    exit /b 1
)

echo.
echo [2/2] 设置完成！现在可以构建项目了。
echo.
echo 运行以下命令构建 Windows 安装包：
echo   cd /d d:\Job
echo   set PATH=%%USERPROFILE%%\.cargo\bin;%%PATH%%
echo   npm run build
echo.
pause

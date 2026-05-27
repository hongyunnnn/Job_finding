@echo off
chcp 65001 >nul
echo ============================================
echo   中国企业招聘信息平台 — 构建 Windows 安装包
echo ============================================
echo.

:: VS 2022 环境
set VS_ROOT=D:\vs
set MSVC_VER=14.51.36231
set WIN_SDK_VER=10.0.26100.0
set WIN_SDK_ROOT=C:\Program Files (x86)\Windows Kits\10

:: PATH
set "MSVC_BIN=%VS_ROOT%\VC\Tools\MSVC\%MSVC_VER%\bin\Hostx64\x64"
set "SDK_BIN=%WIN_SDK_ROOT%\bin\%WIN_SDK_VER%\x64"
set "PATH=%MSVC_BIN%;%SDK_BIN%;%USERPROFILE%\.cargo\bin;%PATH%"

:: 库和头文件路径
set "LIB=%VS_ROOT%\VC\Tools\MSVC\%MSVC_VER%\lib\x64;%WIN_SDK_ROOT%\Lib\%WIN_SDK_VER%\um\x64;%WIN_SDK_ROOT%\Lib\%WIN_SDK_VER%\ucrt\x64"
set "INCLUDE=%VS_ROOT%\VC\Tools\MSVC\%MSVC_VER%\include;%WIN_SDK_ROOT%\Include\%WIN_SDK_VER%\ucrt;%WIN_SDK_ROOT%\Include\%WIN_SDK_VER%\um;%WIN_SDK_ROOT%\Include\%WIN_SDK_VER%\shared"

echo 工具链:
echo   链接器: %MSVC_BIN%\link.exe
echo   SDK:    %WIN_SDK_VER%
echo.
echo 正在构建...
echo.

cd /d "%~dp0"
npx tauri build

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo   构建成功！
    echo   安装包位置: src-tauri\target\release\bundle\
    echo ============================================
) else (
    echo.
    echo ============================================
    echo   构建失败，请检查上方错误信息
    echo ============================================
)
pause

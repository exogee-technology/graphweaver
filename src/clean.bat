@echo off

echo Removing .build directory
if exist ".build" rmdir /s /q .\.build

echo Removing tsconfig.tsbuildinfo files
for /r .\packages %%F in (tsconfig.tsbuildinfo) do (
    if exist "%%F" echo %%F
    if exist "%%F" del "%%F"
)

echo Removing the binary generated file for cli
for /d /r .\packages %%F in (bin\index.js) do (
    if exist "%%F" echo %%F
    if exist "%%F" del "%%F"
)

echo Start clean up directories - create empty directory used for robocopy
mkdir .\empty

echo Removing node_modules
for /d /r %%D in (node_modules) do (
    if exist "%%D" robocopy .\empty "%%D" /purge /NFL /NDL /NJH /NJS /NC /NS /NP > nul
)

echo Removing cdk.out directories
for /d /r %%D in (cdk.out) do (
    if exist "%%D" robocopy .\empty "%%D" /purge /NFL /NDL /NJH /NJS /nc /ns /np > nul
)

echo Removing TypeScript build output (lib folders)
for /d /r .\packages %%D in (lib) do (
    if exist "%%D" robocopy .\empty "%%D" /purge /NFL /NDL /NJH /NJS /nc /ns /np > nul
)

echo Removing package build output (dist folders)
for /d /r .\packages %%D in (dist) do (
    if exist "%%D" robocopy .\empty "%%D" /purge /NFL /NDL /NJH /NJS /nc /ns /np > nul
)

echo Removing example build output (dist folders)
for /d /r .\examples %%D in (dist) do (
    if exist "%%D" robocopy .\empty "%%D" /purge /NFL /NDL /NJH /NJS /nc /ns /np > nul
)

echo Removing Webpack build output (.deploy folders)
for /d /r .\packages %%D in (.deploy) do (
    if exist "%%D" robocopy .\empty "%%D" /purge /NFL /NDL /NJH /NJS /nc /ns /np > nul
)

echo Clean up empty directory used for robocopy
rmdir .\empty

echo Running PNPM install
pnpm install

echo Done!



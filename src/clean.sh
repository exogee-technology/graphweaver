#!/usr/bin/env bash

echo "Removing .build directory"
rm -rf ./.build

echo "Removing node_modules"
find . -name node_modules -type d -exec rm -rf {} +

echo "Removing cdk.out directories"
find . -name cdk.out -type d -exec rm -rf {} +

echo "Removing tsconfig.tsbuildinfo files"
find ./packages/ -name tsconfig.tsbuildinfo -type f -exec rm -rf {} +

echo "Removing TypeScript build output (lib folders)"
find ./packages/ -name lib -type d -exec rm -rf {} +

echo "Removing the binary generated file for cli"
find ./packages/ -name bin/index.js -type d -exec rm -rf {} +

echo "Removing Webpack build output (.deploy folders)"
find ./packages/ -name .deploy -type d -exec rm -rf {} +

echo "Installing dependencies"
pnpm install

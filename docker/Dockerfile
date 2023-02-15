# Using bullseye because we need a modern GLIBC for parcel-css
FROM node:16-bullseye

RUN npm install --global pnpm
RUN apt update --yes
RUN apt install neovim --yes

RUN mkdir /app
WORKDIR /app

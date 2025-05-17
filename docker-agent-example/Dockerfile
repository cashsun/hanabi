# this is a template docker file showing how you can deploy an hanabi agent as a docker image

# build agent image using this file.
# docker build --no-cache -t hanabi-agent .

# Run image (change port to the same port as .hanabi.json serve.port)
# docker run -d --name hanabi-agent -p 3041:3041 hanabi-agent

FROM node:23-alpine

# install hanabi globaly
RUN npm install -g hanabi-cli@latest

ENV NODE_OPTIONS=--max-old-space-size=8192
# IMPORTANT! we set home dir the same as working dir so only one .hanabi.json is needed.
ENV HOME=/usr
WORKDIR /usr

# copy hanabi config files, remove files that's not needed.
# make sure .hanabi.json contains llm setup (for default model) that's copied from <user home>/.hanabi.json
# make sure .hanabi.json contains mcpServers that's used in serve.mcpKeys
COPY .hanabi.json .hanabi.json
COPY hanabi.system.prompt.md hanabi.system.prompt.md
# .env file contains all the secrets & tokens and should not be committed 
COPY .env .env

# copy other files, e.g. local mcp servers
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install

# change port to the same port as .hanabi.json serve.port
EXPOSE 3041

CMD [ "hanabi", "serve" ]
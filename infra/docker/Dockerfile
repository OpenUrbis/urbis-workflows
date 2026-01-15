# build stage
FROM node:20-alpine AS build

ARG REACT_APP_VERSION
ENV REACT_APP_VERSION=$REACT_APP_VERSION

# set working directory
WORKDIR /app

# copy entire monorepo structure
COPY . .

# install monorepo dependencies
RUN yarn install --frozen-lockfile

# set working directory to apps/web
WORKDIR /app/apps/web

# build with vite using only args-passed variables
RUN yarn build

# production stage
FROM nginx:1.23.1-alpine

EXPOSE 80

# copy nginx config file
COPY infra/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# copy vite-built files to nginx directory
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
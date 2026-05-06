FROM node:20-alpine AS builder

# Build arguments (Next inlines NEXT_PUBLIC_* at build time)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_EMAILJS_SERVICE_ID
ARG NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
ARG NEXT_PUBLIC_EMAILJS_PUBLIC_KEY

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_EMAILJS_SERVICE_ID=$NEXT_PUBLIC_EMAILJS_SERVICE_ID
ENV NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=$NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
ENV NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=$NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
ENV NODE_ENV=production

RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
# Run next build directly (skip the build:show post-step which is for local CI display)
RUN pnpm exec next build

FROM nginx:alpine
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
